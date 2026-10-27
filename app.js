(function () {
  "use strict";
  var ethers = window.ethers, C = window.APP_CONFIG, A = window.ARTIFACTS;
  // BOT Chain testnet. The native currency symbol is an assumption: edit it if the chain docs say otherwise.
  var CHAIN = { id: 968, hex: "0x3c8", name: "BOT Chain Testnet", rpc: "https://rpc.bohr.life", explorer: "https://scan.botchain.ai", currency: { name: "BOT", symbol: "BOT", decimals: 18 } };
  var KEY = "botchain968:" + C.slug;
  var $ = function (s) { return document.querySelector(s); };
  var account = null, signer = null, mainAddr = "";
  try { mainAddr = localStorage.getItem(KEY) || ""; } catch (e) {}
  if (!mainAddr) mainAddr = C.address || "";
  var readProvider = new ethers.JsonRpcProvider(CHAIN.rpc, CHAIN.id, { staticNetwork: ethers.Network.from(CHAIN.id) });

  function h(tag, attrs) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }
    return n;
  }
  var short = function (a) { return a.slice(0, 6) + "…" + a.slice(-4); };
  var addrLink = function (a) { return h("a", { href: CHAIN.explorer + "/address/" + a, target: "_blank", rel: "noopener", class: "mono", text: short(a) }); };
  function units(v) {
    var s = ethers.formatUnits(v, 18).split("."), d = (s[1] || "").slice(0, 4).replace(/0+$/, "");
    return BigInt(s[0]).toLocaleString("en-US") + (d ? "." + d : "");
  }
  function fmt(kind, v) {
    if (v === undefined || v === null) return "—";
    switch (kind) {
      case "token": return units(v);
      case "bps": return (Number(v) / 100) + "%";
      case "ratio": return v >= (2n ** 200n) ? "∞" : Number(ethers.formatUnits(v, 18)).toFixed(3);
      case "time": return v === 0n ? "—" : new Date(Number(v) * 1000).toLocaleString();
      case "bool": return v ? "Yes" : "No";
      case "list": return v.length ? Array.prototype.map.call(v, String).join(", ") : "none";
      default: return String(v);
    }
  }
  function fmtNamed(name, v) {
    if (typeof v === "bigint") {
      if (C.enums && C.enums[name]) return C.enums[name][Number(v)] || String(v);
      if ((C.amountFields || []).indexOf(name) > -1) return units(v);
      if ((C.timeFields || []).indexOf(name) > -1) return fmt("time", v);
      return String(v);
    }
    if (typeof v === "boolean") return fmt("bool", v);
    if (typeof v === "string" && ethers.isAddress(v)) return addrLink(v);
    if (v && typeof v === "object" && v.length !== undefined) return Array.prototype.map.call(v, String).join(", ") || "none";
    return String(v);
  }

  // ---------- status toasts ----------
  function toast(msg, opts) {
    opts = opts || {};
    var box = $("#status"), d = h("div", { class: opts.err ? "err" : "" }, msg);
    if (opts.hash) { d.appendChild(document.createTextNode(" ")); d.appendChild(h("a", { href: CHAIN.explorer + "/tx/" + opts.hash, target: "_blank", rel: "noopener", text: "view tx" })); }
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    if (!opts.sticky) setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, opts.err ? 9000 : 5000);
    return d;
  }
  var errText = function (e) { return (e && (e.shortMessage || e.reason || (e.info && e.info.error && e.info.error.message) || e.message)) || String(e); };

  // ---------- wallet ----------
  async function switchChain() {
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.hex }] }); }
    catch (e) {
      if (e && (e.code === 4902 || e.code === -32603 || /unrecognized|not been added/i.test(e.message || ""))) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: CHAIN.hex, chainName: CHAIN.name, nativeCurrency: CHAIN.currency, rpcUrls: [CHAIN.rpc], blockExplorerUrls: [CHAIN.explorer] }] });
      } else throw e;
    }
  }
  async function connect() {
    if (!window.ethereum) throw new Error("No wallet found. Install MetaMask or another EVM wallet, then reload.");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await switchChain();
    signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
    account = await signer.getAddress();
    await refreshBadge();
    await refreshAll();
  }
  async function ensureWallet() {
    if (!signer) await connect();
    var id = await window.ethereum.request({ method: "eth_chainId" });
    if (parseInt(id, 16) !== CHAIN.id) { await switchChain(); signer = await new ethers.BrowserProvider(window.ethereum).getSigner(); }
  }
  async function refreshBadge() {
    var b = $("#netBadge"), btn = $("#connectBtn");
    if (!account) { b.textContent = "Not connected"; b.className = "badge"; btn.textContent = "Connect wallet"; return; }
    var id = parseInt(await window.ethereum.request({ method: "eth_chainId" }), 16);
    btn.textContent = short(account);
    if (id === CHAIN.id) { b.textContent = CHAIN.name + " (968)"; b.className = "badge ok"; }
    else { b.textContent = "Wrong network (" + id + ")"; b.className = "badge bad"; }
  }
  function runner() { return signer || readProvider; }
  function mainC() { return new ethers.Contract(mainAddr, A.main.abi, runner()); }
  function tokenC(addr) { return new ethers.Contract(addr, A.token.abi, runner()); }
  async function send(label, call) {
    await ensureWallet();
    var t = toast(label + ": confirm in your wallet…", { sticky: true });
    try {
      var tx = await call();
      t.remove();
      var p = toast(label + ": pending…", { sticky: true, hash: tx.hash });
      await tx.wait();
      p.remove();
      toast(label + " confirmed ✓", { hash: tx.hash });
      await refreshAll();
    } catch (e) { t.remove(); toast(label + " failed: " + errText(e), { err: true }); }
  }

  // ---------- inputs ----------
  function field(inp) {
    var id = "f_" + inp.id, ctl;
    if (inp.type === "bool") {
      ctl = h("select", { id: id });
      (inp.options || [["true", "Yes"], ["false", "No"]]).forEach(function (o) { ctl.appendChild(h("option", { value: o[0], text: o[1] })); });
    } else {
      ctl = h("input", { id: id, autocomplete: "off", inputmode: (inp.type === "amount" || inp.type === "uint" || inp.type === "days" || inp.type === "daysFromNow") ? "decimal" : "text", placeholder: inp.placeholder || (inp.type === "address" ? (inp.meDefault ? "0x… (blank = you)" : "0x…") : ""), value: inp.default != null ? inp.default : "" });
    }
    return h("label", {}, inp.label, ctl);
  }
  function parse(inp, form) {
    var el = form.querySelector("#f_" + inp.id), v = (el.value || "").trim();
    if (inp.type === "bool") return v === "true";
    if (v === "" && !(inp.type === "address" && inp.meDefault)) throw new Error(inp.label + " is required");
    switch (inp.type) {
      case "amount": return ethers.parseUnits(v, 18);
      case "uint": return BigInt(v);
      case "days": return BigInt(v) * 86400n;
      case "daysFromNow": return BigInt(Math.floor(Date.now() / 1000)) + BigInt(v) * 86400n;
      case "address":
        if (v === "" || v.toLowerCase() === "me") { if (!account) throw new Error("Connect your wallet first"); return account; }
        if (!ethers.isAddress(v)) throw new Error(inp.label + " is not a valid address");
        return v;
      default: return v;
    }
  }

  // ---------- sections ----------
  function renderResult(fnName, res) {
    var outs = mainC().interface.getFunction(fnName).outputs, dl = h("dl", { class: "kv" });
    if (outs.length === 1) {
      var d = h("dd"); d.append(fmtNamed(outs[0].name, res));
      dl.appendChild(h("dt", { text: outs[0].name || "result" })); dl.appendChild(d);
    } else {
      outs.forEach(function (o, i) {
        var d2 = h("dd"); d2.append(fmtNamed(o.name, res[i]));
        dl.appendChild(h("dt", { text: o.name || "#" + i })); dl.appendChild(d2);
      });
    }
    return dl;
  }
  function renderActions() {
    var box = $("#actions"); box.innerHTML = "";
    (C.actions || []).forEach(function (a) {
      var form = h("form", {}, h("h3", { text: a.title }), a.desc ? h("p", { class: "desc", text: a.desc }) : null);
      var row = h("div", { class: "row" });
      (a.inputs || []).forEach(function (i) { row.appendChild(field(i)); });
      form.appendChild(row);
      var btn = h("button", { class: "btn primary", type: "submit", text: a.button || a.title });
      form.appendChild(btn);
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault(); btn.disabled = true;
        try {
          var args = (a.inputs || []).map(function (i) { return parse(i, form); });
          if (!mainAddr) throw new Error("Deploy or enter the contract address first");
          await send(a.title, function () { return mainC()[a.fn].apply(null, args); });
        } catch (e) { toast(errText(e), { err: true }); }
        btn.disabled = false;
      });
      box.appendChild(h("div", { class: "card act" }, form));
    });
  }
  function renderViews() {
    var box = $("#views"); box.innerHTML = "";
    (C.views || []).forEach(function (v) {
      var out = h("div"), form = h("form", {}, h("h3", { text: v.title }), v.desc ? h("p", { class: "desc", text: v.desc }) : null);
      var row = h("div", { class: "row" });
      (v.inputs || []).forEach(function (i) { row.appendChild(field(i)); });
      form.appendChild(row);
      var btn = h("button", { class: "btn", type: "submit", text: v.button || "Look up" });
      form.appendChild(btn); form.appendChild(out);
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault(); out.innerHTML = "";
        try {
          if (!mainAddr) throw new Error("Deploy or enter the contract address first");
          var args = (v.inputs || []).map(function (i) { return parse(i, form); });
          var res = await mainC()[v.fn].apply(null, args);
          out.appendChild(renderResult(v.fn, res));
        } catch (e) { out.appendChild(h("p", { class: "desc", text: errText(e) })); }
      });
      box.appendChild(h("div", { class: "card qry" }, form));
    });
  }
  async function renderStats() {
    var box = $("#stats"); box.innerHTML = "";
    if (!mainAddr) return;
    var c = mainC();
    await Promise.all((C.stats || []).map(async function (s) {
      var cell = h("div", { class: "stat" }, h("span", { text: s.label }), h("b", { text: "…" }));
      box.appendChild(cell);
      try {
        if ((s.args || []).indexOf("me") > -1 && !account) { cell.lastChild.textContent = "Connect wallet"; return; }
        var res = await c[s.fn].apply(null, (s.args || []).map(function (x) { return x === "me" ? account : x; }));
        if (s.pick) res = res[s.pick];
        cell.lastChild.textContent = fmt(s.fmt, res);
      } catch (e) { cell.lastChild.textContent = "n/a"; }
    }));
  }
  async function renderTokens() {
    var box = $("#tokens"); box.innerHTML = "";
    if (!mainAddr || !(C.tokens || []).length) { box.style.display = "none"; return; }
    box.style.display = "";
    box.appendChild(h("h2", { text: "Test tokens" }));
    box.appendChild(h("p", { class: "desc", text: "Get free test tokens, then approve this app to spend them before staking, trading or paying." }));
    for (var i = 0; i < C.tokens.length; i++) {
      try {
        var addr = await mainC()[C.tokens[i]](), t = tokenC(addr), sym = await t.symbol();
        var bal = account ? await t.balanceOf(account) : null, al = account ? await t.allowance(account, mainAddr) : null;
        var row = h("div", { class: "tok" }, h("span", { class: "n", text: sym }),
          h("span", { class: "m" }, addrLink(addr), account ? "  balance " + units(bal) + " · approved " + (al > 2n ** 200n ? "unlimited" : units(al)) : "  connect wallet to see balance"));
        (function (t, sym) {
          row.appendChild(h("button", { class: "btn", type: "button", text: "Get 1,000 " + sym, onclick: function () { send("Faucet " + sym, function () { return t.faucet(); }); } }));
          row.appendChild(h("button", { class: "btn", type: "button", text: "Approve " + sym, onclick: function () { send("Approve " + sym, function () { return t.approve(mainAddr, ethers.MaxUint256); }); } }));
        })(t, sym);
        box.appendChild(row);
      } catch (e) { box.appendChild(h("p", { class: "desc", text: "Could not read token " + C.tokens[i] + ": " + errText(e) })); }
    }
  }
  async function refreshAll() {
    $("#addrInput").value = mainAddr;
    $("#contractLink").innerHTML = "";
    if (mainAddr) $("#contractLink").appendChild(addrLink(mainAddr)); else $("#contractLink").textContent = "not yet";
    if (mainAddr) {
      try { if ((await readProvider.getCode(mainAddr)) === "0x") toast("No contract found at that address on BOT Chain testnet.", { err: true }); } catch (e) {}
    }
    await Promise.all([renderStats(), renderTokens()]);
  }

  // ---------- deploy ----------
  async function deployAll() {
    var btn = $("#deployBtn"); btn.disabled = true;
    try {
      await ensureWallet();
      var addrs = [], d = C.deploy;
      for (var i = 0; i < d.tokens.length; i++) {
        var t = d.tokens[i], m = toast("Deploying " + t.symbol + " (confirm in wallet)…", { sticky: true });
        var tf = new ethers.ContractFactory(A.token.abi, A.token.bytecode, signer), tc = await tf.deploy(t.name, t.symbol);
        await tc.waitForDeployment(); addrs.push(await tc.getAddress()); m.remove();
      }
      var args = d.args.map(function (a) { return typeof a === "string" && a.indexOf("$t") === 0 ? addrs[Number(a.slice(2))] : (a === "$me" ? account : a); });
      var m2 = toast("Deploying " + C.name + " (confirm in wallet)…", { sticky: true });
      var f = new ethers.ContractFactory(A.main.abi, A.main.bytecode, signer), c = await f.deploy.apply(f, args);
      await c.waitForDeployment();
      mainAddr = await c.getAddress(); m2.remove();
      try { localStorage.setItem(KEY, mainAddr); } catch (e) {}
      toast(C.name + " deployed at " + short(mainAddr) + " ✓");
      await refreshAll();
    } catch (e) { toast("Deploy failed: " + errText(e), { err: true }); }
    btn.disabled = false;
  }

  // ---------- boot ----------
  document.title = C.name + " · BOT Chain Testnet";
  document.documentElement.style.setProperty("--accent", C.accent);
  $("#appName").textContent = C.name; $("#tagline").textContent = C.tagline; $("#aboutText").textContent = C.about || "";
  $("#connectBtn").addEventListener("click", function () { connect().catch(function (e) { toast(errText(e), { err: true }); }); });
  $("#deployBtn").addEventListener("click", deployAll);
  $("#saveBtn").addEventListener("click", function () {
    var v = $("#addrInput").value.trim();
    if (!ethers.isAddress(v)) return toast("Enter a valid contract address.", { err: true });
    mainAddr = v; try { localStorage.setItem(KEY, v); } catch (e) {}
    refreshAll();
  });
  if (window.ethereum) {
    if (window.ethereum.on) {
      window.ethereum.on("accountsChanged", function () { signer = null; account = null; refreshBadge(); refreshAll(); });
      window.ethereum.on("chainChanged", function () { window.location.reload(); });
    }
    window.ethereum.request({ method: "eth_accounts" }).then(function (a) { if (a && a.length) connect().catch(function () {}); }).catch(function () {});
  }
  renderActions(); renderViews(); refreshAll();
})();
