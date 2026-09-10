const fs = require("fs");
const path = require("path");

const { lessonPatches } = require("./patches.js");
const { quizAdditions } = require("./quizAdditions.js");

const coursePath = path.join(__dirname, "..", "src", "course.js");
let src = fs.readFileSync(coursePath, "utf8");
src = src.replace("export const chapters =", "module.exports =").replace(/;\s*$/, "");
const chapters = eval(src);

let patchedLessons = 0;
const missingPatchIds = [];

for (const ch of chapters) {
  for (const lesson of ch.lessons) {
    const patch = lessonPatches[lesson.id];
    if (!patch) {
      missingPatchIds.push(lesson.id);
      continue;
    }
    patchedLessons++;
    const d = lesson.deep;
    if (patch.mechanics) d.mechanics = patch.mechanics;
    if (patch.practical) d.practical = patch.practical;
    if (patch.mistake) d.mistake = patch.mistake;
    if (patch.risk) d.risk = patch.risk;
    if (patch.checklist) d.checklist = patch.checklist;
    if (patch.breakeven) d.breakeven = patch.breakeven;
    if (patch.maxProfit) d.maxProfit = patch.maxProfit;
    if (patch.maxLoss) d.maxLoss = patch.maxLoss;
    if (patch.scenarios) d.scenarios = patch.scenarios;
    if (patch.bambo_sections_extra) {
      lesson.bambo_sections = [...(lesson.bambo_sections || []), ...patch.bambo_sections_extra];
    }
    if (patch.references_extra) {
      const existing = new Set(lesson.references || []);
      for (const r of patch.references_extra) existing.add(r);
      lesson.references = Array.from(existing);
    }
  }
  const additions = quizAdditions[ch.id];
  if (additions) {
    ch.quiz = [...ch.quiz, ...additions];
  }
}

if (missingPatchIds.length) {
  console.error("WARNING: lessons without patches:", missingPatchIds);
}
console.log("Patched lessons:", patchedLessons);
console.log("Chapters:", chapters.map(c => `${c.id}: ${c.lessons.length} lessons, ${c.quiz.length} quiz`).join(" | "));

const out = "export const chapters = " + JSON.stringify(chapters, null, 2) + ";\n";
fs.writeFileSync(coursePath, out, "utf8");
console.log("Wrote", coursePath, "(", out.length, "chars )");
