(() => {
  const valueEl = document.getElementById("value");
  const exprEl = document.getElementById("expr");
  const SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  let cur = "0";      // number being typed / shown
  let prev = null;    // stored first number
  let op = null;      // pending operator
  let fresh = false;  // next digit starts a new number
  let error = false;

  /* ---------- helpers ---------- */
  const fmt = n => {
    if (!isFinite(n)) return null;
    let s = String(parseFloat(n.toPrecision(12)));
    if (s.length > 12) s = n.toExponential(5).replace(/\.?0+e/, "e");
    return s;
  };

  const calc = (a, o, b) => {
    a = parseFloat(a);
    b = parseFloat(b);
    if (o === "+") return a + b;
    if (o === "-") return a - b;
    if (o === "*") return a * b;
    if (o === "/") return b === 0 ? NaN : a / b;
  };

  function render(pop) {
    valueEl.textContent = cur.replace("-", "−");
    valueEl.className = "value" + (cur.length > 15 ? " sm" : cur.length > 9 ? " md" : "");
    if (pop) { void valueEl.offsetWidth; valueEl.classList.add("pop"); }

    exprEl.textContent = op && prev !== null
      ? `${prev} ${SYM[op]}` + (fresh ? "" : ` ${cur}`)
      : exprEl.dataset.done || "";

    document.querySelectorAll(".key.op").forEach(k =>
      k.classList.toggle("active-op", !!op && fresh && k.dataset.op === op)
    );
  }

  const reset = () => {
    cur = "0"; prev = null; op = null; fresh = false; error = false;
    exprEl.dataset.done = "";
  };

  const fail = () => {
    reset();
    error = true;
    cur = "Oops! ÷ by 0";
    render(true);
  };

  /* ---------- actions ---------- */
  function digit(d) {
    if (error) reset();
    exprEl.dataset.done = "";
    if (fresh) { cur = d; fresh = false; }
    else if (cur.replace(/[-.]/g, "").length < 12) cur = cur === "0" ? d : cur + d;
    render();
  }

  function dot() {
    if (error) reset();
    if (fresh) { cur = "0."; fresh = false; }
    else if (!cur.includes(".")) cur += ".";
    render();
  }

  function operate(o) {
    if (error) return;
    if (op && !fresh) {
      const s = fmt(calc(prev, op, cur));
      if (s === null) return fail();
      cur = s;
    }
    prev = cur; op = o; fresh = true;
    exprEl.dataset.done = "";
    render(true);
  }

  function equals() {
    if (error || !op) return;
    const b = cur;
    const s = fmt(calc(prev, op, b));
    if (s === null) return fail();
    exprEl.dataset.done = `${prev} ${SYM[op]} ${b} =`;
    cur = s; prev = null; op = null; fresh = true;
    render(true);
  }

  function sign() {
    if (error || cur === "0") return;
    cur = cur.startsWith("-") ? cur.slice(1) : "-" + cur;
    render();
  }

  function percent() {
    if (error) return;
    const s = fmt(parseFloat(cur) / 100);
    if (s) { cur = s; fresh = true; render(true); }
  }

  function back() {
    if (error) { reset(); return render(); }
    if (fresh) return;
    cur = cur.slice(0, -1);
    if (cur === "" || cur === "-") cur = "0";
    render();
  }

  function clear() { reset(); render(true); }

  /* ---------- button clicks ---------- */
  document.getElementById("keys").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.num) digit(b.dataset.num);
    else if (b.dataset.op) operate(b.dataset.op);
    else ({ clear, sign, percent, dot, back, equals })[b.dataset.act]();
  });

  /* ---------- keyboard support ---------- */
  const flash = sel => {
    const b = document.querySelector(sel);
    if (!b) return;
    b.classList.add("down");
    setTimeout(() => b.classList.remove("down"), 110);
  };

  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k))            { digit(k);  flash(`[data-num="${k}"]`); }
    else if ("+-*/".includes(k))      { e.preventDefault(); operate(k); flash(`[data-op="${k}"]`); }
    else if (k === "." || k === ",")  { dot();     flash('[data-act="dot"]'); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); flash('[data-act="equals"]'); }
    else if (k === "Backspace")       { back();    flash('[data-act="back"]'); }
    else if (k === "Escape")          { clear();   flash('[data-act="clear"]'); }
    else if (k === "%")               { percent(); flash('[data-act="percent"]'); }
  });

  render();
})();