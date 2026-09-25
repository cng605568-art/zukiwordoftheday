export default async function handler(req, res) {
  const word = String(req.query.word || "").trim();

  if (!word || !/^[a-zA-Z-]+$/.test(word)) {
    return res.status(400).json({ error: "Invalid word." });
  }

  const url =
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  try {
    const response = await fetch(url);
    const body = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.send(body);
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      error: "Dictionary API unavailable."
    });
  }
}
