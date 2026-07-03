import { get } from "http";

get("http://localhost:5000/videos", (res) => {
  let raw = "";
  res.on("data", (c) => (raw += c));
  res.on("end", () => {
    const data = JSON.parse(raw);
    const seen = new Set();
    data.videos.forEach((v) => {
      const k = v.anime + "|||" + v.season;
      if (!seen.has(k)) {
        seen.add(k);
        console.log(JSON.stringify({ anime: v.anime, season: v.season }));
      }
    });
  });
});
