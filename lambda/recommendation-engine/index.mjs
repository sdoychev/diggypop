import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// ─── Source tables (set via Lambda environment variables) ───
const CHARADES_TABLES = [
  process.env.TABLE_CHARADES_STAGING,
  process.env.TABLE_CHARADES_DEV,
].filter(Boolean);

const MOJIMATCH_TABLES = [
  process.env.TABLE_MOJIMATCH_STAGING,
  process.env.TABLE_MOJIMATCH_DEV,
  process.env.TABLE_MOJIMATCH_V2_STAGING,
  process.env.TABLE_MOJIMATCH_V2_DEV,
].filter(Boolean);

const OUTPUT_TABLE = process.env.TABLE_RECOMMENDATIONS || "RecommendationDashboard";

// ─── DynamoDB helpers ───

async function queryAllByUuid(tableName, uuid) {
  const items = [];
  let lastKey;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "#uuid = :uuid",
      ExpressionAttributeNames: { "#uuid": "uuid" },
      ExpressionAttributeValues: { ":uuid": uuid },
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function queryCharades(uuid) {
  const all = await Promise.all(CHARADES_TABLES.map(t => queryAllByUuid(t, uuid)));
  return all.flat();
}

async function queryMojiMatch(uuid) {
  const all = await Promise.all(MOJIMATCH_TABLES.map(t => queryAllByUuid(t, uuid)));
  return all.flat();
}

// ─── Parsers for DynamoDB field formats ───

function parseLabels(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const str = String(raw).trim();
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(s => String(s).trim());
  } catch {}
  // Android format: [happy, sad, angry] (no quotes)
  const match = str.match(/^\[(.+)\]$/s);
  if (match) return match[1].split(",").map(s => s.trim());
  return [];
}

function parseDecks(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // DocumentClient unmarshals List<Map> to array of objects or strings
    return raw.map(d => (typeof d === "object" && d.S) ? d.S : String(d));
  }
  const str = String(raw).trim();
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(d => (typeof d === "object" && d.S) ? d.S : String(d));
  } catch {}
  return [];
}

function parseGuesses(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(g => {
      const s = (typeof g === "object" && g.S) ? g.S : String(g);
      const parts = s.split("/");
      return { emotion: parts[0] || "", result: parts[1] || "", time: parseInt(parts[2]) || 0 };
    });
  }
  return [];
}

// ─── Profile builder (aggregates raw DynamoDB rows into a single user profile) ───

function buildProfile(uuid, charadesRows, mojiMatchRows) {
  const profile = { uuid, charades: null, mojiMatch: [] };

  // Aggregate Charades events
  if (charadesRows.length > 0) {
    const starts = charadesRows.filter(r => r.eventName === "GAME_START");
    const ends = charadesRows.filter(r =>
      r.eventName === "GAME_END_SHARE" || r.eventName === "GAME_END_DELETE"
    );

    const allDecks = new Set();
    charadesRows.forEach(r => parseDecks(r.selectedDecks).forEach(d => allDecks.add(d)));

    const dates = charadesRows.map(r => r.createdAt).filter(Boolean).sort();
    const points = ends.map(r => Number(r.points) || 0);
    const avgPoints = points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0;

    profile.charades = {
      sessions: starts.length,
      completedGames: ends.length,
      avgPoints,
      decks: [...allDecks],
      firstPlay: dates[0] || null,
      lastPlay: dates[dates.length - 1] || null,
    };
  }

  // Build MojiMatch sessions with accuracy
  // Deduplicate by EventTimeMS across tables
  const seen = new Set();
  for (const row of mojiMatchRows) {
    const key = `${row.uuid}_${row.EventTimeMS}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const grader = parseLabels(row.graderLabel);
    const player = parseLabels(row.playerLabel);
    if (grader.length === 0) continue;

    const correct = grader.reduce(
      (acc, g, i) => acc + (g === (player[i] || "") ? 1 : 0), 0
    );
    const accuracy = correct / grader.length;

    profile.mojiMatch.push({
      createdAt: row.createdAt || "",
      accuracy,
      coins: Number(row.GWcoins) || 0,
      sessionTime: Number(row.totalSessionTimeSeconds) || 0,
    });
  }

  return profile;
}

// ─── Recommendation engine (ported from App.jsx getRecs) ───

function getRecs(pr, uuid) {
  const recs = [];
  const totalSess = (pr.charades?.sessions || 0) + pr.mojiMatch.length;
  const avgAcc = pr.mojiMatch.length > 0
    ? pr.mojiMatch.reduce((a, m) => a + m.accuracy, 0) / pr.mojiMatch.length
    : null;

  const mojiTrend = (() => {
    if (pr.mojiMatch.length < 2) return null;
    const sorted = [...pr.mojiMatch].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sorted[sorted.length - 1].accuracy - sorted[0].accuracy;
  })();

  const now = new Date();
  const daysSince = (() => {
    const d = [];
    if (pr.charades?.lastPlay) d.push(new Date(pr.charades.lastPlay));
    if (pr.mojiMatch.length) {
      const s = [...pr.mojiMatch].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      d.push(new Date(s[0].createdAt));
    }
    if (!d.length) return 999;
    return Math.floor((now - Math.max(...d)) / 86400000);
  })();

  const compRate = pr.charades && pr.charades.sessions > 0
    ? Math.round(pr.charades.completedGames / pr.charades.sessions * 100)
    : null;

  // Frequency
  if (daysSince > 60) {
    recs.push({ uuid, pri: "high", icon: "🔴", title: "User Has Gone Inactive", msg: `No activity in ${daysSince} days. This user may have churned. Consider a re-engagement prompt or push notification.`, color: "#EF4444", tag: "Engagement" });
  } else if (daysSince > 14) {
    recs.push({ uuid, pri: "high", icon: "⏰", title: "Resume Regular Play", msg: `It's been ${daysSince} days since the last session. Recommend at least 3 sessions per week for consistency. A gentle reminder could help.`, color: "#EF4444", tag: "Frequency" });
  } else if (daysSince > 5) {
    recs.push({ uuid, pri: "medium", icon: "📅", title: "Session Gap Detected", msg: `Last session was ${daysSince} days ago. Encourage maintaining a more regular cadence for best results.`, color: "#F59E0B", tag: "Frequency" });
  }

  // Completion rate
  if (compRate !== null && compRate < 50) {
    recs.push({ uuid, pri: "high", icon: "⚠️", title: "Low Game Completion Rate", msg: `Only ${compRate}% of Charades sessions are completed (${pr.charades.completedGames}/${pr.charades.sessions}). The user may be frustrated or losing interest mid-game. Try shorter sessions or easier decks.`, color: "#EF4444", tag: "Engagement" });
  }

  // MojiMatch accuracy
  if (avgAcc !== null) {
    if (avgAcc < 0.5) {
      recs.push({ uuid, pri: "high", icon: "🎯", title: "Emotion Labeling Needs Support", msg: `MojiMatch accuracy is at ${(avgAcc * 100).toFixed(0)}%. The child may need more adult-led modeling. Try playing together with the adult labeling first, then the child repeating.`, color: "#EF4444", tag: "MojiMatch" });
    } else if (avgAcc < 0.75) {
      recs.push({ uuid, pri: "medium", icon: "📈", title: "Growing Emotion Recognition", msg: `MojiMatch accuracy is ${(avgAcc * 100).toFixed(0)}% — good progress. Keep practicing at current difficulty. Focus on the emotions most frequently confused.`, color: "#F59E0B", tag: "MojiMatch" });
    } else {
      recs.push({ uuid, pri: "low", icon: "✅", title: "Strong Emotion Recognition", msg: `MojiMatch accuracy is ${(avgAcc * 100).toFixed(0)}% — excellent. Consider trying the Faces deck in Charades if not already used, since real faces add complexity.`, color: "#10B981", tag: "MojiMatch" });
    }
  }

  // Accuracy trend
  if (mojiTrend !== null) {
    if (mojiTrend < -0.15) {
      recs.push({ uuid, pri: "medium", icon: "📉", title: "Accuracy Declining", msg: `Emotion labeling dropped ${Math.abs(Math.round(mojiTrend * 100))} percentage points since first session. Could indicate fatigue or increased difficulty. Consider easier content.`, color: "#F59E0B", tag: "MojiMatch" });
    } else if (mojiTrend > 0.1) {
      recs.push({ uuid, pri: "low", icon: "🚀", title: "Accuracy Improving", msg: `Accuracy improved ${Math.round(mojiTrend * 100)} points across sessions — the child is learning. Keep the current routine going.`, color: "#10B981", tag: "MojiMatch" });
    }
  }

  // Deck variety
  if (pr.charades && pr.charades.decks.length === 1 && pr.charades.sessions > 3) {
    recs.push({ uuid, pri: "medium", icon: "🎨", title: "Try More Deck Themes", msg: `Only using "${pr.charades.decks[0]}" across ${pr.charades.sessions} sessions. Mixing in new themes like Animals, Faces, or Sports keeps things fresh and helps generalize skills.`, color: "#6366F1", tag: "Variety" });
  } else if (pr.charades && pr.charades.decks.length <= 2 && pr.charades.sessions > 8) {
    const sug = ["Animals", "Faces", "Colors", "Objects", "Sports"].filter(d => !pr.charades.decks.includes(d));
    if (sug.length) recs.push({ uuid, pri: "low", icon: "🎨", title: "Expand Deck Variety", msg: `Using ${pr.charades.decks.length} deck types over ${pr.charades.sessions} sessions. Consider adding: ${sug.slice(0, 3).join(", ")}.`, color: "#6366F1", tag: "Variety" });
  }

  // Low charades score
  if (pr.charades && pr.charades.avgPoints < 1.5 && pr.charades.sessions >= 4) {
    recs.push({ uuid, pri: "medium", icon: "🎲", title: "Low Charades Scores", msg: `Averaging ${pr.charades.avgPoints.toFixed(1)} points/game. The child may do better starting with more familiar, concrete decks (Animals, Objects) rather than abstract ones (Emotions).`, color: "#F59E0B", tag: "Charades" });
  }

  // Cross-game suggestions
  if (pr.charades && pr.charades.sessions > 5 && pr.mojiMatch.length === 0) {
    recs.push({ uuid, pri: "medium", icon: "😊", title: "Try MojiMatch", msg: `${pr.charades.sessions} Charades sessions but hasn't tried MojiMatch. MojiMatch builds emotion recognition by labeling emotions on emojis and real faces — a great complement to Charades.`, color: "#8B5CF6", tag: "Cross-game" });
  }
  if (pr.mojiMatch.length > 0 && (!pr.charades || pr.charades.sessions < 3)) {
    recs.push({ uuid, pri: "medium", icon: "🎭", title: "Try Charades", msg: `Active in MojiMatch but minimal Charades play. Charades adds a physical, expressive dimension — acting out emotions and concepts builds on recognition skills.`, color: "#4F46E5", tag: "Cross-game" });
  }

  // Faces suggestion
  if (pr.charades && pr.charades.decks.includes("Emotions") && !pr.charades.decks.includes("Faces") && pr.charades.sessions > 10) {
    recs.push({ uuid, pri: "low", icon: "🧑", title: "Consider the Faces Deck", msg: `Experienced with Emotions deck. The Faces deck uses real human expressions, adding complexity and building real-world recognition skills.`, color: "#EC4899", tag: "Progression" });
  }

  // High engagement
  if (totalSess >= 25) {
    recs.push({ uuid, pri: "low", icon: "🌟", title: "Power User", msg: `${totalSess} total sessions — outstanding consistency. This level of regular practice drives lasting skill development.`, color: "#10B981", tag: "Engagement" });
  }

  return recs.sort((a, b) =>
    ({ high: 0, medium: 1, low: 2 }[a.pri] || 2) - ({ high: 0, medium: 1, low: 2 }[b.pri] || 2)
  );
}

// ─── Write recommendations to output table ───

async function writeRecommendations(uuid, recs, profile) {
  await ddb.send(new PutCommand({
    TableName: OUTPUT_TABLE,
    Item: {
      uuid,
      updatedAt: new Date().toISOString(),
      recommendations: recs,
      profileSnapshot: {
        charades: profile.charades,
        mojiMatchSessions: profile.mojiMatch.length,
        mojiMatchAvgAccuracy: profile.mojiMatch.length > 0
          ? profile.mojiMatch.reduce((a, m) => a + m.accuracy, 0) / profile.mojiMatch.length
          : null,
      },
    },
  }));
}

// ─── Lambda handler (DynamoDB Streams trigger) ───

export const handler = async (event) => {
  // Extract unique UUIDs from the stream batch
  const uuids = new Set();
  for (const record of event.Records) {
    if (record.eventName === "REMOVE") continue;
    const newImage = record.dynamodb?.NewImage;
    if (newImage?.uuid?.S) {
      uuids.add(newImage.uuid.S);
    }
  }

  console.log(`Processing ${uuids.size} unique user(s): ${[...uuids].join(", ")}`);

  const results = [];
  for (const uuid of uuids) {
    try {
      const [charadesRows, mojiMatchRows] = await Promise.all([
        queryCharades(uuid),
        queryMojiMatch(uuid),
      ]);

      const profile = buildProfile(uuid, charadesRows, mojiMatchRows);
      const recs = getRecs(profile, uuid);

      await writeRecommendations(uuid, recs, profile);

      console.log(`✓ ${uuid}: ${recs.length} recommendations (${recs.filter(r => r.pri === "high").length} high)`);
      results.push({ uuid, status: "ok", recsCount: recs.length });
    } catch (err) {
      console.error(`✗ ${uuid}: ${err.message}`);
      results.push({ uuid, status: "error", error: err.message });
    }
  }

  return { processed: results.length, results };
};
