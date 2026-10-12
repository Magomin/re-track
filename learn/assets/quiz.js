document.querySelectorAll("fieldset.quiz").forEach((quiz) => {
  const feedback = quiz.querySelector(".feedback");
  const why = quiz.querySelector(".why");
  quiz.addEventListener("change", (e) => {
    if (e.target.type !== "radio" || !feedback) return;
    const ok = e.target.hasAttribute("data-correct");
    feedback.textContent = ok ? "Correcto." : "No. Prueba otra vez.";
    feedback.className = "feedback " + (ok ? "correct" : "wrong");
    if (why) why.hidden = !ok;
  });
});
