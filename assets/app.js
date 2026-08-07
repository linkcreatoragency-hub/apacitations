/* APA Citations — citation engine (APA 7, APA 6, MLA 9, Chicago 17, Harvard) */
(function () {
  "use strict";

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MLA_MONTHS = ["Jan.","Feb.","Mar.","Apr.","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function initial(name) {
    return name ? name.trim().charAt(0).toUpperCase() + "." : "";
  }
  function endsWithPunct(s) { return /[.!?]$/.test(s.trim()); }
  function period(s) { s = s.trim(); return endsWithPunct(s) ? s : s + "."; }
  function stripProtocol(url) { return String(url || "").replace(/^https?:\/\//i, ""); }
  function ord(n) { // 2 -> 2nd
    n = parseInt(n, 10);
    if (isNaN(n)) return "";
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function parseEdition(raw) { // "2", "2nd", "Second" -> number-ish string or raw
    if (!raw) return "";
    var m = String(raw).match(/\d+/);
    return m ? ord(m[0]) : raw.trim();
  }

  /* ---------- author name formatting ---------- */
  // a = {first, middle, last}
  function apaName(a) {
    var out = a.last.trim();
    var inits = [initial(a.first), initial(a.middle)].filter(Boolean).join(" ");
    if (inits) out += ", " + inits;
    return out;
  }
  function fullNameInverted(a) { // "Last, First Middle"
    var rest = [a.first, a.middle].map(function (x) { return (x || "").trim(); }).filter(Boolean).join(" ");
    return rest ? a.last.trim() + ", " + rest : a.last.trim();
  }
  function fullNameNormal(a) { // "First Middle Last"
    return [a.first, a.middle, a.last].map(function (x) { return (x || "").trim(); }).filter(Boolean).join(" ");
  }
  function harvardName(a) {
    var inits = [initial(a.first), initial(a.middle)].filter(Boolean).join("");
    return inits ? a.last.trim() + ", " + inits : a.last.trim();
  }
  function cleanAuthors(authors) {
    return (authors || []).filter(function (a) { return a && a.last && a.last.trim(); });
  }

  function apaAuthors(authors) {
    var A = cleanAuthors(authors).map(apaName);
    if (!A.length) return "";
    if (A.length === 1) return A[0];
    if (A.length === 2) return A[0] + ", & " + A[1];
    if (A.length <= 20) return A.slice(0, -1).join(", ") + ", & " + A[A.length - 1];
    return A.slice(0, 19).join(", ") + ", . . . " + A[A.length - 1];
  }
  function apa6Authors(authors) {
    var A = cleanAuthors(authors).map(apaName);
    if (!A.length) return "";
    if (A.length === 1) return A[0];
    if (A.length === 2) return A[0] + ", & " + A[1];
    if (A.length <= 7) return A.slice(0, -1).join(", ") + ", & " + A[A.length - 1];
    return A.slice(0, 6).join(", ") + ", . . . " + A[A.length - 1];
  }
  function mlaAuthors(authors) {
    var C = cleanAuthors(authors);
    if (!C.length) return "";
    if (C.length === 1) return period(fullNameInverted(C[0]));
    if (C.length === 2) return period(fullNameInverted(C[0]) + ", and " + fullNameNormal(C[1]));
    return period(fullNameInverted(C[0]) + ", et al");
  }
  function chicagoAuthors(authors) {
    var C = cleanAuthors(authors);
    if (!C.length) return "";
    if (C.length === 1) return period(fullNameInverted(C[0]));
    var parts = [fullNameInverted(C[0])];
    for (var i = 1; i < C.length - 1; i++) parts.push(fullNameNormal(C[i]));
    return period(parts.join(", ") + (C.length > 1 ? ", and " + fullNameNormal(C[C.length - 1]) : ""));
  }
  function harvardAuthors(authors) {
    var C = cleanAuthors(authors);
    if (!C.length) return "";
    var A = C.map(harvardName);
    if (A.length === 1) return A[0];
    if (A.length === 2) return A[0] + " and " + A[1];
    if (A.length === 3) return A[0] + ", " + A[1] + " and " + A[2];
    return A[0] + " <em>et al.</em>";
  }

  /* ---------- date helpers ---------- */
  function apaDate(d) { // (Year, Month Day)
    if (!d.year) return "(n.d.)";
    var s = d.year;
    if (d.month) {
      s += ", " + MONTHS[d.month - 1];
      if (d.day) s += " " + d.day;
    }
    return "(" + s + ")";
  }
  function mlaDate(d) { // 21 Oct. 2020
    if (!d.year) return "";
    var parts = [];
    if (d.day) parts.push(d.day);
    if (d.month) parts.push(MLA_MONTHS[d.month - 1]);
    parts.push(d.year);
    return parts.join(" ");
  }
  function chicagoDate(d) { // October 21, 2020
    if (!d.year) return "n.d.";
    if (d.month && d.day) return MONTHS[d.month - 1] + " " + d.day + ", " + d.year;
    if (d.month) return MONTHS[d.month - 1] + " " + d.year;
    return String(d.year);
  }
  function todayLong() {
    var t = new Date();
    return MONTHS[t.getMonth()] + " " + t.getDate() + ", " + t.getFullYear();
  }
  function todayHarvard() {
    var t = new Date();
    return t.getDate() + " " + MONTHS[t.getMonth()] + " " + t.getFullYear();
  }
  function todayMla() {
    var t = new Date();
    return t.getDate() + " " + MLA_MONTHS[t.getMonth()] + " " + t.getFullYear();
  }

  /* ---------- data collection ---------- */
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function collectAuthors() {
    var rows = document.querySelectorAll("#authorsList .author-row");
    var out = [];
    rows.forEach(function (r) {
      out.push({
        first: r.querySelector(".a-first").value.trim(),
        middle: r.querySelector(".a-middle").value.trim(),
        last: r.querySelector(".a-last").value.trim()
      });
    });
    return out;
  }
  function collect(type) {
    return {
      type: type,
      authors: collectAuthors(),
      title: val("f-title"),
      container: val("f-container"),
      publisher: val("f-publisher"),
      edition: val("f-edition"),
      volume: val("f-volume"),
      issue: val("f-issue"),
      pages: val("f-pages"),
      url: val("f-url"),
      doi: val("f-doi"),
      username: val("f-username"),
      date: { year: val("f-year"), month: parseInt(val("f-month"), 10) || 0, day: val("f-day") }
    };
  }

  /* ---------- formatters ---------- */
  // Each returns {ref: html, intext: html}
  var FORMATTERS = {
    apa7: function (d) { return apaFormat(d, apaAuthors); },
    apa6: function (d) { return apaFormat(d, apa6Authors, true); },
    mla9: mlaFormat,
    chicago: chicagoFormat,
    harvard: harvardFormat
  };

  function doiOrUrl(d) {
    if (d.doi) {
      var doi = d.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      return "https://doi.org/" + doi;
    }
    return d.url || "";
  }

  function apaFormat(d, authorFn, isApa6) {
    var A = authorFn(d.authors);
    var date = apaDate(d.date);
    var link = doiOrUrl(d);
    var parts = [];
    var intextAuthor = intextName(d);

    if (d.type === "journal") {
      var head = A ? period(A) + " " + date + "." : (d.title ? "" : "") ;
      var src = "<em>" + esc(d.container) + "</em>";
      if (d.volume) src += ", <em>" + esc(d.volume) + "</em>";
      if (d.issue) src += "(" + esc(d.issue) + ")";
      if (d.pages) src += ", " + esc(d.pages.replace(/-/g, "–"));
      var ref = (A ? period(A) + " " : "") + date + ". " + period(esc(d.title)) + " " + period(src);
      if (link) ref += " " + link;
      return { ref: ref, intext: apaIntext(intextAuthor, d.date.year) };
    }
    if (d.type === "book") {
      var t = "<em>" + esc(d.title) + "</em>";
      var ed = parseEdition(d.edition);
      if (ed) t += " (" + esc(ed) + " ed.)";
      var ref2 = (A ? period(A) + " " : "") + "(" + (d.date.year || "n.d.") + "). " + period(t);
      if (d.publisher) {
        if (isApa6) ref2 += " " + period(esc(d.publisher));
        else ref2 += " " + period(esc(d.publisher));
      }
      if (link) ref2 += " " + link;
      return { ref: ref2, intext: apaIntext(intextAuthor, d.date.year) };
    }
    if (d.type === "video") {
      var who = A || (d.username ? esc(d.username) : "");
      if (A && d.username) who = A.replace(/\.$/, "") + " [" + esc(d.username) + "]";
      var ref3 = (who ? period(who) + " " : "") + date + ". <em>" + esc(d.title) + "</em> [Video]. " + period(esc(d.container || "YouTube"));
      if (d.url) ref3 += " " + d.url;
      return { ref: ref3, intext: apaIntext(intextAuthor, d.date.year) };
    }
    // website
    var refW;
    if (A) {
      refW = period(A) + " " + date + ". <em>" + esc(d.title) + "</em>.";
      if (d.container && d.container.toLowerCase() !== (cleanAuthors(d.authors)[0] || {last:""}).last.toLowerCase()) {
        refW += " " + period(esc(d.container));
      }
    } else {
      refW = "<em>" + esc(d.title) + "</em>. " + date + ".";
      if (d.container) refW += " " + period(esc(d.container));
    }
    if (d.url) refW += " " + d.url;
    return { ref: refW, intext: apaIntext(intextAuthor, d.date.year) };
  }

  function intextName(d) {
    var C = cleanAuthors(d.authors);
    if (C.length === 1) return C[0].last;
    if (C.length === 2) return C[0].last + " & " + C[1].last;
    if (C.length >= 3) return C[0].last + " et al.";
    if (d.username) return d.username;
    if (d.container && d.type === "website") return d.container;
    return d.title ? "&#8220;" + esc(shorten(d.title)) + "&#8221;" : "";
  }
  function shorten(t) {
    var words = t.split(/\s+/);
    return words.length > 4 ? words.slice(0, 4).join(" ") : t;
  }
  function apaIntext(name, year) {
    return "(" + name + ", " + (year || "n.d.") + ")";
  }

  function mlaFormat(d) {
    var A = mlaAuthors(d.authors);
    var C = cleanAuthors(d.authors);
    var intext = "(" + (C.length ? (C.length >= 3 ? C[0].last + " et al." : C.length === 2 ? C[0].last + " and " + C[1].last : C[0].last) : "&#8220;" + esc(shorten(d.title)) + "&#8221;") + ")";
    var ref = A ? A + " " : "";

    if (d.type === "book") {
      ref += "<em>" + esc(d.title) + "</em>.";
      var bits = [];
      var ed = parseEdition(d.edition);
      if (ed) bits.push(ed + " ed.");
      if (d.publisher) bits.push(esc(d.publisher));
      if (d.date.year) bits.push(d.date.year);
      if (bits.length) ref += " " + period(bits.join(", "));
      return { ref: ref, intext: intext };
    }
    if (d.type === "journal") {
      ref += "&#8220;" + period(esc(d.title)) + "&#8221; <em>" + esc(d.container) + "</em>";
      if (d.volume) ref += ", vol. " + esc(d.volume);
      if (d.issue) ref += ", no. " + esc(d.issue);
      if (d.date.year) ref += ", " + d.date.year;
      if (d.pages) ref += ", pp. " + esc(d.pages);
      ref = period(ref);
      var link = doiOrUrl(d);
      if (link) ref += " " + period(stripProtocol(link));
      return { ref: ref, intext: intext };
    }
    if (d.type === "video") {
      ref = "&#8220;" + period(esc(d.title)) + "&#8221; <em>" + esc(d.container || "YouTube") + "</em>";
      if (d.username) ref += ", uploaded by " + esc(d.username);
      var dt = mlaDate(d.date);
      if (dt) ref += ", " + dt;
      if (d.url) ref += ", " + stripProtocol(d.url);
      return { ref: period(ref), intext: intext };
    }
    // website
    ref += "&#8220;" + period(esc(d.title)) + "&#8221; <em>" + esc(d.container) + "</em>";
    var dt2 = mlaDate(d.date);
    if (dt2) ref += ", " + dt2;
    if (d.url) ref += ", " + stripProtocol(d.url);
    ref = period(ref);
    if (!d.date.year) ref += " Accessed " + todayMla() + ".";
    return { ref: ref, intext: intext };
  }

  function chicagoFormat(d) {
    var A = chicagoAuthors(d.authors);
    var C = cleanAuthors(d.authors);
    var name = C.length ? (C.length >= 4 ? C[0].last + " et al." : C.map(function (a) { return a.last; }).join(C.length === 2 ? " and " : ", ").replace(/, ([^,]*)$/, ", and $1")) : (d.container || shorten(d.title));
    var intext = "(" + name + " " + (d.date.year || "n.d.") + (d.pages ? ", " + d.pages : "") + ")";
    var ref = A ? A + " " : "";

    if (d.type === "book") {
      ref += "<em>" + period(esc(d.title)) + "</em>";
      var ed = parseEdition(d.edition);
      if (ed) ref += " " + ed + " ed.";
      var tail = [];
      if (d.publisher) tail.push(esc(d.publisher));
      if (d.date.year) tail.push(d.date.year);
      if (tail.length) ref += " " + period(tail.join(", "));
      return { ref: ref, intext: intext };
    }
    if (d.type === "journal") {
      ref += "&#8220;" + period(esc(d.title)) + "&#8221; <em>" + esc(d.container) + "</em>";
      if (d.volume) ref += " " + esc(d.volume);
      if (d.issue) ref += ", no. " + esc(d.issue);
      if (d.date.year) ref += " (" + d.date.year + ")";
      if (d.pages) ref += ": " + esc(d.pages.replace(/-/g, "–"));
      ref = period(ref);
      var link = doiOrUrl(d);
      if (link) ref += " " + period(link);
      return { ref: ref, intext: intext };
    }
    if (d.type === "video") {
      ref = (d.username ? period(esc(d.username)) + " " : ref);
      ref += "&#8220;" + period(esc(d.title)) + "&#8221; " + esc(d.container || "YouTube") + " video. " + period(chicagoDate(d.date));
      if (d.url) ref += " " + period(d.url);
      return { ref: ref, intext: intext };
    }
    // website
    ref += "&#8220;" + period(esc(d.title)) + "&#8221;";
    if (d.container) ref += " " + period(esc(d.container));
    ref += " " + (d.date.year ? period(chicagoDate(d.date)) : "Accessed " + period(todayLong()));
    if (d.url) ref += " " + period(d.url);
    return { ref: ref, intext: intext };
  }

  function harvardFormat(d) {
    var A = harvardAuthors(d.authors);
    var C = cleanAuthors(d.authors);
    var name = C.length ? (C.length >= 4 ? C[0].last + " <em>et al.</em>" : C.map(function (a) { return a.last; }).join(C.length === 2 ? " and " : ", ").replace(/, ([^,]*)$/, " and $1")) : (d.container || shorten(d.title));
    var intext = "(" + name + ", " + (d.date.year || "no date") + ")";
    var yr = "(" + (d.date.year || "no date") + ")";
    var ref = (A ? A + " " : "") + yr + " ";

    if (d.type === "book") {
      ref += "<em>" + period(esc(d.title)) + "</em>";
      var ed = parseEdition(d.edition);
      if (ed) ref += " " + ed + " edn.";
      if (d.publisher) ref += " " + period(esc(d.publisher));
      return { ref: ref, intext: intext };
    }
    if (d.type === "journal") {
      ref += "&#8216;" + esc(d.title) + "&#8217;, <em>" + esc(d.container) + "</em>";
      if (d.volume) ref += ", " + esc(d.volume);
      if (d.issue) ref += "(" + esc(d.issue) + ")";
      if (d.pages) ref += ", pp. " + esc(d.pages.replace(/-/g, "–"));
      ref = period(ref);
      var link = doiOrUrl(d);
      if (link) ref += " Available at: " + link + " (Accessed: " + todayHarvard() + ").";
      return { ref: ref, intext: intext };
    }
    // website & video
    ref += "<em>" + period(esc(d.title)) + "</em>";
    if (d.url) ref += " Available at: " + d.url + " (Accessed: " + todayHarvard() + ").";
    return { ref: ref, intext: intext };
  }

  /* ---------- form field templates per source type ---------- */
  var FIELDS = {
    website: [
      { id: "f-title", label: "Page / article title *", full: true, ph: "e.g., The health benefits of walking" },
      { id: "f-container", label: "Website name", ph: "e.g., Healthline" },
      { id: "f-url", label: "URL", ph: "https://..." },
      { id: "f-year", label: "Year published", ph: "2024" },
      { id: "f-month", label: "Month", type: "month" },
      { id: "f-day", label: "Day", ph: "21" }
    ],
    book: [
      { id: "f-title", label: "Book title *", full: true, ph: "e.g., Thinking, fast and slow" },
      { id: "f-publisher", label: "Publisher", ph: "e.g., Penguin Books" },
      { id: "f-year", label: "Year published", ph: "2011" },
      { id: "f-edition", label: "Edition (if not first)", ph: "e.g., 2nd" },
      { id: "f-doi", label: "DOI or URL (e-book, optional)", ph: "10.xxxx/xxxxx" }
    ],
    journal: [
      { id: "f-title", label: "Article title *", full: true, ph: "e.g., Effects of sleep on memory consolidation" },
      { id: "f-container", label: "Journal name", ph: "e.g., Journal of Sleep Research" },
      { id: "f-year", label: "Year", ph: "2023" },
      { id: "f-volume", label: "Volume", ph: "12" },
      { id: "f-issue", label: "Issue", ph: "3" },
      { id: "f-pages", label: "Pages", ph: "45-67" },
      { id: "f-doi", label: "DOI", ph: "10.1111/jsr.13456" }
    ],
    video: [
      { id: "f-title", label: "Video title *", full: true, ph: "e.g., How the immune system works" },
      { id: "f-username", label: "Channel / username", ph: "e.g., Kurzgesagt" },
      { id: "f-container", label: "Platform", ph: "YouTube", value: "YouTube" },
      { id: "f-url", label: "URL", ph: "https://youtube.com/watch?v=..." },
      { id: "f-year", label: "Year", ph: "2024" },
      { id: "f-month", label: "Month", type: "month" },
      { id: "f-day", label: "Day", ph: "1" }
    ]
  };

  var AUTOCITE = {
    website: { label: "Paste the website URL to cite automatically", ph: "https://www.example.com/article", btn: "Cite it" },
    book: { label: "Enter an ISBN to fill book details automatically", ph: "ISBN e.g., 9780374533557", btn: "Search" },
    journal: { label: "Enter a DOI to fill article details automatically", ph: "DOI e.g., 10.1038/nature12373", btn: "Search" },
    video: null
  };

  var currentType = "website";

  function monthSelect(id) {
    var o = '<select id="' + id + '"><option value="">—</option>';
    MONTHS.forEach(function (m, i) { o += '<option value="' + (i + 1) + '">' + m + "</option>"; });
    return o + "</select>";
  }

  function renderForm(type) {
    currentType = type;
    var wrap = document.getElementById("formFields");
    if (!wrap) return;
    var html = "";
    FIELDS[type].forEach(function (f) {
      var cls = f.full ? ' class="full"' : "";
      html += "<div" + cls + '><label for="' + f.id + '">' + f.label + "</label>";
      if (f.type === "month") html += monthSelect(f.id);
      else html += '<input type="text" id="' + f.id + '" placeholder="' + (f.ph || "") + '" value="' + (f.value || "") + '">';
      html += "</div>";
    });
    wrap.innerHTML = html;

    var ac = document.getElementById("autociteWrap");
    if (ac) {
      var conf = AUTOCITE[type];
      if (conf) {
        ac.style.display = "";
        document.getElementById("autociteInput").placeholder = conf.ph;
        document.getElementById("autociteLabel").textContent = conf.label;
        document.getElementById("autociteBtn").textContent = conf.btn;
      } else {
        ac.style.display = "none";
      }
    }
    hideResult();
  }

  function hideResult() {
    var r = document.getElementById("resultBox");
    if (r) r.classList.remove("show");
    var n = document.getElementById("toolNotice");
    if (n) n.classList.remove("show");
  }

  function notice(msg) {
    var n = document.getElementById("toolNotice");
    if (!n) return;
    n.textContent = msg;
    n.classList.add("show");
  }

  function generate() {
    var style = document.getElementById("styleSelect").value;
    var data = collect(currentType);
    if (!data.title) { notice("Please enter a title — it's the only required field."); return; }
    var out = FORMATTERS[style](data);
    document.getElementById("refOutput").innerHTML = out.ref;
    document.getElementById("intextOutput").innerHTML = "<strong>In-text citation:</strong> " + out.intext;
    document.getElementById("resultBox").classList.add("show");
    var n = document.getElementById("toolNotice");
    if (n) n.classList.remove("show");
    document.getElementById("resultBox").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function copyCitation() {
    var el = document.getElementById("refOutput");
    var html = el.innerHTML;
    var text = el.innerText;
    function done() {
      var m = document.getElementById("copiedMsg");
      m.style.display = "inline";
      setTimeout(function () { m.style.display = "none"; }, 2000);
    }
    if (navigator.clipboard && window.ClipboardItem) {
      var item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      });
      navigator.clipboard.write([item]).then(done, function () {
        navigator.clipboard.writeText(text).then(done);
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done);
    }
  }

  /* ---------- authors UI ---------- */
  function authorRow() {
    var div = document.createElement("div");
    div.className = "author-row";
    div.innerHTML =
      '<input type="text" class="a-first" placeholder="First name">' +
      '<input type="text" class="a-middle" placeholder="Middle name / initial">' +
      '<input type="text" class="a-last" placeholder="Last name">' +
      '<button type="button" class="remove-author" title="Remove author" aria-label="Remove author">&times;</button>';
    div.querySelector(".remove-author").addEventListener("click", function () {
      var list = document.getElementById("authorsList");
      if (list.querySelectorAll(".author-row").length > 1) div.remove();
      else div.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    });
    return div;
  }

  /* ---------- autocite ---------- */
  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el && v) el.value = v;
  }
  function setAuthorsFromNames(names) {
    // names: array of "First Last" or {given, family}
    var list = document.getElementById("authorsList");
    list.innerHTML = "";
    if (!names || !names.length) { list.appendChild(authorRow()); return; }
    names.slice(0, 20).forEach(function (n) {
      var row = authorRow();
      var first = "", last = "";
      if (typeof n === "object") { first = n.given || ""; last = n.family || ""; }
      else {
        var parts = String(n).trim().split(/\s+/);
        last = parts.pop() || "";
        first = parts.join(" ");
      }
      row.querySelector(".a-first").value = first;
      row.querySelector(".a-last").value = last;
      list.appendChild(row);
    });
    if (!list.children.length) list.appendChild(authorRow());
  }

  function autocite() {
    var q = document.getElementById("autociteInput").value.trim();
    if (!q) return;
    var btn = document.getElementById("autociteBtn");
    var orig = btn.textContent;
    btn.textContent = "Searching…";
    btn.disabled = true;
    function finish() { btn.textContent = orig; btn.disabled = false; }

    if (currentType === "book") {
      var isbn = q.replace(/[^0-9Xx]/g, "");
      fetch("https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&format=json&jscmd=data")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var b = j["ISBN:" + isbn];
          if (!b) { notice("Book not found for that ISBN. Please fill in the form manually."); finish(); return; }
          setVal("f-title", b.title);
          setVal("f-publisher", b.publishers && b.publishers[0] && b.publishers[0].name);
          var ym = (b.publish_date || "").match(/\d{4}/);
          if (ym) setVal("f-year", ym[0]);
          setAuthorsFromNames((b.authors || []).map(function (a) { return a.name; }));
          finish();
        })
        .catch(function () { notice("Lookup failed. Please fill in the form manually."); finish(); });
      return;
    }
    if (currentType === "journal") {
      var doi = q.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      fetch("https://api.crossref.org/works/" + encodeURIComponent(doi))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var w = j.message;
          setVal("f-title", w.title && w.title[0]);
          setVal("f-container", w["container-title"] && w["container-title"][0]);
          setVal("f-volume", w.volume);
          setVal("f-issue", w.issue);
          setVal("f-pages", w.page);
          setVal("f-doi", w.DOI);
          var dp = w.issued && w.issued["date-parts"] && w.issued["date-parts"][0];
          if (dp && dp[0]) setVal("f-year", String(dp[0]));
          setAuthorsFromNames(w.author || []);
          finish();
        })
        .catch(function () { notice("DOI not found. Please fill in the form manually."); finish(); });
      return;
    }
    // website
    fetch("/api/meta?url=" + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) { notice("Couldn't read that page automatically — please fill in the form manually."); finish(); return; }
        setVal("f-title", j.title);
        setVal("f-container", j.siteName);
        setVal("f-url", q);
        if (j.year) setVal("f-year", String(j.year));
        if (j.month) { var m = document.getElementById("f-month"); if (m) m.value = String(j.month); }
        if (j.day) setVal("f-day", String(j.day));
        if (j.author) setAuthorsFromNames([j.author]);
        finish();
      })
      .catch(function () { notice("Couldn't read that page automatically — please fill in the form manually."); finish(); });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var tool = document.getElementById("citationTool");
    if (tool) {
      var defaultStyle = tool.getAttribute("data-style") || "apa7";
      var styleSel = document.getElementById("styleSelect");
      styleSel.value = defaultStyle;

      document.querySelectorAll(".tab").forEach(function (t) {
        t.addEventListener("click", function () {
          document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
          t.classList.add("active");
          renderForm(t.getAttribute("data-type"));
        });
      });

      document.getElementById("authorsList").appendChild(authorRow());
      document.getElementById("addAuthor").addEventListener("click", function () {
        document.getElementById("authorsList").appendChild(authorRow());
      });
      document.getElementById("generateBtn").addEventListener("click", generate);
      document.getElementById("copyBtn").addEventListener("click", copyCitation);
      var acBtn = document.getElementById("autociteBtn");
      if (acBtn) acBtn.addEventListener("click", autocite);
      var acInput = document.getElementById("autociteInput");
      if (acInput) acInput.addEventListener("keydown", function (e) { if (e.key === "Enter") autocite(); });
      renderForm("website");
    }

    var toggle = document.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        document.querySelector(".main-nav").classList.toggle("open");
      });
    }
  });
})();
