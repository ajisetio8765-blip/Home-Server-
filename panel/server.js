if (!process.env.DALANG_BYPASS_AUTH_SIGN) {
  const _s = "DalangStore";
  const _a = "Created by dalang";
  if (!_s || !_a) {
    process.exit(1);
  }
}
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  spawn,
  exec,
  execSync
} = require("child_process");
const crypto = require("crypto");
const net = require("net");
const zlib = require("zlib");
const BASE_DIR = path.resolve(__dirname, "..");
const LOG_DIR = path.join(BASE_DIR, "logs");
const STATE_FILE = path.join(__dirname, "state.json");
const AUTH_CONFIG_FILE = path.join(__dirname, "auth-config.json");
const PANEL_PORT = parseInt(process.env.PANEL_PORT || "8080", 10);
const _0x7facf3 = {
  username: process.env.PANEL_USER || "admin",
  password: process.env.PANEL_PASS || "admin123"
};
let authConfig = _0x7facf3;
function loadAuthConfig() {
  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      const _0x887e38 = fs.readFileSync(AUTH_CONFIG_FILE, "utf8");
      const _0x3e0ebb = JSON.parse(_0x887e38);
      if (_0x3e0ebb.username && typeof _0x3e0ebb.username === "string") {
        authConfig.username = _0x3e0ebb.username.trim();
      }
      if (_0x3e0ebb.password && typeof _0x3e0ebb.password === "string") {
        authConfig.password = _0x3e0ebb.password.trim();
      }
    } else {
      saveAuthConfig(authConfig.username, authConfig.password);
    }
  } catch (_0x1903d4) {
    console.error("Gagal membaca auth-config.json:", _0x1903d4.message);
  }
}
function saveAuthConfig(_0x1b2072, _0x4c8682) {
  try {
    if (_0x1b2072) {
      authConfig.username = _0x1b2072.trim();
    }
    if (_0x4c8682) {
      authConfig.password = _0x4c8682.trim();
    }
    fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(authConfig, null, 2), "utf8");
  } catch (_0x2c2858) {
    console.error("Gagal menyimpan auth-config.json:", _0x2c2858.message);
  }
}
loadAuthConfig();
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, {
    recursive: true
  });
}
function formatLogTimestamp() {
  const _0x4e3c49 = new Date();
  const _0x1033e8 = _0x52e51c => String(_0x52e51c).padStart(2, "0");
  return _0x4e3c49.getFullYear() + "-" + _0x1033e8(_0x4e3c49.getMonth() + 1) + "-" + _0x1033e8(_0x4e3c49.getDate()) + " " + _0x1033e8(_0x4e3c49.getHours()) + ":" + _0x1033e8(_0x4e3c49.getMinutes()) + ":" + _0x1033e8(_0x4e3c49.getSeconds());
}
function appendServerLog(_0xa6fb21, _0x2a063a = "INFO") {
  try {
    const _0x22ccdb = path.join(LOG_DIR, "panel.log");
    const _0x189aed = "[" + formatLogTimestamp() + "] [" + _0x2a063a + "] " + _0xa6fb21 + "\n";
    fs.appendFileSync(_0x22ccdb, _0x189aed, "utf8");
  } catch (_0x4886f7) {}
}
function initServerLog() {
  try {
    const _0x50f9d1 = path.join(LOG_DIR, "panel.log");
    const _0x23387e = "================================================================================\n  DALANG MINI SERVER — SERVER LOGS (LIVE OUTPUT)\n================================================================================\n[" + formatLogTimestamp() + "] [SYSTEM] Server panel diinisialisasi (Node.js " + process.version + ", " + os.platform() + " " + os.arch() + ")\n[" + formatLogTimestamp() + "] [NETWORK] Web Dashboard aktif di Port " + PANEL_PORT + " (http://127.0.0.1:" + PANEL_PORT + ")\n[" + formatLogTimestamp() + "] [STATUS] Layanan Panel berjalan normal (Online 24/7)\n";
    if (!fs.existsSync(_0x50f9d1) || fs.statSync(_0x50f9d1).size === 0) {
      fs.writeFileSync(_0x50f9d1, _0x23387e, "utf8");
    } else {
      fs.appendFileSync(_0x50f9d1, "\n[" + formatLogTimestamp() + "] [SYSTEM] Server panel dimulai ulang (Node.js " + process.version + ")\n", "utf8");
    }
  } catch (_0x286497) {}
}
initServerLog();
const SESSIONS_FILE = path.join(__dirname, "sessions.json");
const activeSessions = new Map();
const failedAttempts = new Map();
const activeTerminalJobs = new Map();
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const _0x29cd5e = fs.readFileSync(SESSIONS_FILE, "utf8");
      const _0x2df062 = JSON.parse(_0x29cd5e);
      const _0x359a81 = Date.now();
      activeSessions.clear();
      for (const _0x18efc9 in _0x2df062) {
        const _0x35f9c0 = _0x2df062[_0x18efc9];
        if (_0x35f9c0 && _0x35f9c0.expiresAt && _0x35f9c0.expiresAt > _0x359a81) {
          activeSessions.set(_0x18efc9, _0x35f9c0);
        }
      }
    }
  } catch (_0x55e11c) {
    console.error("Gagal membaca sessions.json:", _0x55e11c.message);
  }
}
function saveSessions() {
  try {
    const _0x4f04e1 = {};
    const _0x3f302a = Date.now();
    for (const [_0xbabb70, _0x3420ba] of activeSessions.entries()) {
      if (_0x3420ba.expiresAt > _0x3f302a) {
        _0x4f04e1[_0xbabb70] = _0x3420ba;
      }
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(_0x4f04e1, null, 2), "utf8");
  } catch (_0x1f9ce6) {
    console.error("Gagal menyimpan sessions.json:", _0x1f9ce6.message);
  }
}
function isSessionValid(_0x58e542) {
  if (!_0x58e542) {
    return false;
  }
  const _0x5df510 = activeSessions.get(_0x58e542);
  if (!_0x5df510) {
    return false;
  }
  if (_0x5df510.expiresAt <= Date.now()) {
    activeSessions.delete(_0x58e542);
    saveSessions();
    return false;
  }
  return true;
}
function createSession(_0xab915a, _0x3f41bf = "admin", _0x547cfa = "127.0.0.1") {
  const _0x9cefee = {
    user: _0x3f41bf,
    ip: _0x547cfa,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2592000000
  };
  activeSessions.set(_0xab915a, _0x9cefee);
  saveSessions();
  return _0x9cefee;
}
function deleteSession(_0x1c53e6) {
  if (_0x1c53e6 && activeSessions.has(_0x1c53e6)) {
    activeSessions.delete(_0x1c53e6);
    saveSessions();
  }
}
loadSessions();
function getClientIP(_0x2e86ad) {
  const _0x3a5672 = _0x2e86ad.headers["x-forwarded-for"];
  if (_0x3a5672) {
    return _0x3a5672.split(",")[0].trim();
  }
  return _0x2e86ad.socket && _0x2e86ad.socket.remoteAddress || "127.0.0.1";
}
function parseCookies(_0x22b68f) {
  const _0x2083b4 = {};
  const _0x41b7e3 = _0x22b68f.headers.cookie;
  if (!_0x41b7e3) {
    return _0x2083b4;
  }
  _0x41b7e3.split(";").forEach(_0x3de891 => {
    const _0x4dd88b = _0x3de891.split("=");
    _0x2083b4[_0x4dd88b.shift().trim()] = decodeURI(_0x4dd88b.join("="));
  });
  return _0x2083b4;
}
function checkAuth(_0x24841b) {
  const _0x27df18 = parseCookies(_0x24841b);
  if (_0x27df18.session_token && isSessionValid(_0x27df18.session_token)) {
    return true;
  }
  const _0x833658 = _0x24841b.headers.authorization || "";
  if (_0x833658.startsWith("Bearer ")) {
    const _0x5553bc = _0x833658.substring(7).trim();
    if (isSessionValid(_0x5553bc)) {
      return true;
    }
  }
  if (_0x833658.startsWith("Basic ")) {
    const _0x2ee059 = _0x833658.substring(6).trim();
    const _0x4c78c8 = Buffer.from(_0x2ee059, "base64").toString("utf8");
    const _0x415b5b = _0x4c78c8.indexOf(":");
    const _0x23e2a5 = _0x4c78c8.slice(0, _0x415b5b);
    const _0x3fba6d = _0x4c78c8.slice(_0x415b5b + 1);
    if (_0x23e2a5 === authConfig.username && _0x3fba6d === authConfig.password) {
      return true;
    }
  }
  return false;
}
function getAuthUser(_0x2263c1) {
  const _0x43b0c5 = parseCookies(_0x2263c1);
  if (_0x43b0c5.session_token && activeSessions.has(_0x43b0c5.session_token)) {
    const _0x257c74 = activeSessions.get(_0x43b0c5.session_token);
    if (_0x257c74 && _0x257c74.user) {
      return _0x257c74.user;
    }
  }
  const _0x4417a3 = _0x2263c1.headers.authorization || "";
  if (_0x4417a3.startsWith("Bearer ")) {
    const _0x5956f1 = _0x4417a3.substring(7).trim();
    if (activeSessions.has(_0x5956f1)) {
      const _0xe482aa = activeSessions.get(_0x5956f1);
      if (_0xe482aa && _0xe482aa.user) {
        return _0xe482aa.user;
      }
    }
  }
  if (_0x4417a3.startsWith("Basic ")) {
    const _0x30ef35 = _0x4417a3.substring(6).trim();
    const _0x277f91 = Buffer.from(_0x30ef35, "base64").toString("utf8");
    const _0x1ce46e = _0x277f91.indexOf(":");
    const _0x409882 = _0x277f91.slice(0, _0x1ce46e);
    if (_0x409882) {
      return _0x409882;
    }
  }
  return authConfig.username || "admin";
}
function isPortListening(_0x13328e, _0x227d64 = "127.0.0.1") {
  return new Promise(_0x3f4a24 => {
    const _0x54c364 = new net.Socket();
    _0x54c364.setTimeout(1200);
    _0x54c364.on("connect", () => {
      _0x54c364.destroy();
      _0x3f4a24(true);
    });
    _0x54c364.on("error", () => {
      _0x54c364.destroy();
      _0x3f4a24(false);
    });
    _0x54c364.on("timeout", () => {
      _0x54c364.destroy();
      _0x3f4a24(false);
    });
    _0x54c364.connect(_0x13328e, _0x227d64);
  });
}
function checkAndRotateLogs() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      return;
    }
    const _0x163830 = fs.readdirSync(LOG_DIR);
    for (let _0x737e7 = 0; _0x737e7 < _0x163830.length; _0x737e7++) {
      const _0x2eaf37 = _0x163830[_0x737e7];
      if (!_0x2eaf37.endsWith(".log")) {
        continue;
      }
      const _0x73e8e7 = path.join(LOG_DIR, _0x2eaf37);
      const _0x28ae5e = fs.statSync(_0x73e8e7);
      if (_0x28ae5e.size > 2097152) {
        const _0x7202ed = Buffer.alloc(65536);
        const _0x49a640 = fs.openSync(_0x73e8e7, "r");
        const _0xf087d9 = Math.max(0, _0x28ae5e.size - _0x7202ed.length);
        const _0x5b19d6 = fs.readSync(_0x49a640, _0x7202ed, 0, _0x7202ed.length, _0xf087d9);
        fs.closeSync(_0x49a640);
        const _0x32eab3 = _0x7202ed.slice(0, _0x5b19d6).toString("utf8");
        const _0x2f1ab4 = _0x32eab3.split("\n");
        _0x2f1ab4.shift();
        const _0x4d4cbd = _0x2f1ab4.join("\n");
        fs.writeFileSync(_0x73e8e7, "[" + new Date().toISOString() + "] (Log otomatis dipangkas, batas 2MB)\n" + _0x4d4cbd);
      }
    }
  } catch (_0x4ddcba) {}
  if (global.gc) {
    try {
      global.gc();
    } catch (_0x24a433) {}
  }
}
checkAndRotateLogs();
setInterval(checkAndRotateLogs, 300000);
function getLocalIPs() {
  const _0x2f07b5 = [];
  const _0x2de2f2 = os.networkInterfaces();
  for (const _0x15b105 of Object.keys(_0x2de2f2)) {
    for (const _0x2e6df8 of _0x2de2f2[_0x15b105]) {
      if (_0x2e6df8.family === "IPv4" && !_0x2e6df8.internal) {
        const _0xda13ab = {
          iface: _0x15b105,
          address: _0x2e6df8.address
        };
        _0x2f07b5.push(_0xda13ab);
      }
    }
  }
  return _0x2f07b5;
}
function getThermalInfo() {
  let _0x5ea7e0 = null;
  let _0x2c1b60 = null;
  let _0x238f66 = [null, null, null, null];
  try {
    if (fs.existsSync("/sys/class/thermal")) {
      const _0x369b9a = fs.readdirSync("/sys/class/thermal").filter(_0x2d3558 => _0x2d3558.startsWith("thermal_zone"));
      let _0xf6a815 = [];
      let _0x4c238d = {};
      let _0x457c88 = {};
      for (let _0x483371 = 0; _0x483371 < _0x369b9a.length; _0x483371++) {
        const _0x25a416 = _0x369b9a[_0x483371];
        try {
          const _0xce420b = "/sys/class/thermal/" + _0x25a416 + "/type";
          const _0x1910a7 = "/sys/class/thermal/" + _0x25a416 + "/temp";
          if (!fs.existsSync(_0xce420b) || !fs.existsSync(_0x1910a7)) {
            continue;
          }
          const _0x37d79d = fs.readFileSync(_0xce420b, "utf8").trim().toLowerCase();
          const _0x2d6649 = parseInt(fs.readFileSync(_0x1910a7, "utf8").trim(), 10);
          if (isNaN(_0x2d6649)) {
            continue;
          }
          const _0x55912a = _0x2d6649 > 1000 ? Math.round(_0x2d6649 / 1000) : _0x2d6649;
          if (_0x55912a > 0 && _0x55912a < 120) {
            const _0x4a59b8 = _0x37d79d.match(/^tsens_tz_sensor([0-9]+)$/);
            if (_0x4a59b8) {
              const _0x50d392 = parseInt(_0x4a59b8[1], 10);
              _0x4c238d[_0x50d392] = _0x55912a;
            }
            const _0x28ec92 = _0x37d79d.match(/cpu[_-]?([0-9]+)|core[_-]?([0-9]+)/);
            if (_0x28ec92) {
              const _0x17527e = parseInt(_0x28ec92[1] || _0x28ec92[2], 10);
              _0x457c88[_0x17527e] = _0x55912a;
            }
            if (_0x37d79d.startsWith("tsens_tz") || _0x37d79d.includes("cpu")) {
              _0xf6a815.push(_0x55912a);
            }
          }
          if ((_0x37d79d === "battery" || _0x37d79d.includes("bat") || _0x37d79d.includes("bms")) && _0x2c1b60 === null) {
            const _0x154277 = _0x2d6649 > 1000 ? _0x2d6649 / 1000 : _0x2d6649 > 100 ? _0x2d6649 / 10 : _0x2d6649;
            _0x2c1b60 = _0x154277.toFixed(1);
          }
        } catch {}
      }
      if (Object.keys(_0x457c88).length >= 4) {
        _0x238f66 = [_0x457c88[0], _0x457c88[1], _0x457c88[2], _0x457c88[3]];
      } else if (_0x4c238d[1] !== undefined && _0x4c238d[2] !== undefined && _0x4c238d[3] !== undefined && _0x4c238d[4] !== undefined) {
        _0x238f66 = [_0x4c238d[1], _0x4c238d[2], _0x4c238d[3], _0x4c238d[4]];
      } else if (_0x4c238d[0] !== undefined && _0x4c238d[1] !== undefined && _0x4c238d[2] !== undefined && _0x4c238d[3] !== undefined) {
        _0x238f66 = [_0x4c238d[0], _0x4c238d[1], _0x4c238d[2], _0x4c238d[3]];
      }
      if (_0xf6a815.length > 0) {
        _0x5ea7e0 = Math.max(..._0xf6a815);
      }
    }
  } catch {}
  if (_0x2c1b60 === null) {
    try {
      const _0x2a9eea = "/sys/class/power_supply/battery/temp";
      if (fs.existsSync(_0x2a9eea)) {
        const _0x16da56 = parseInt(fs.readFileSync(_0x2a9eea, "utf8").trim(), 10);
        if (!isNaN(_0x16da56)) {
          _0x2c1b60 = (_0x16da56 > 100 ? _0x16da56 / 10 : _0x16da56).toFixed(1);
        }
      }
    } catch {}
  }
  if (_0x5ea7e0 === null && os.platform() === "win32") {
    _0x5ea7e0 = 42;
    _0x2c1b60 = "33.0";
    _0x238f66 = [41, 43, 42, 40];
  } else {
    for (let _0x5a80da = 0; _0x5a80da < 4; _0x5a80da++) {
      if (_0x238f66[_0x5a80da] === null && _0x5ea7e0 !== null) {
        _0x238f66[_0x5a80da] = _0x5ea7e0;
      }
    }
  }
  let _0x38a680 = "Optimal";
  if (_0x5ea7e0 !== null) {
    if (_0x5ea7e0 >= 75) {
      _0x38a680 = "Panas";
    } else if (_0x5ea7e0 >= 60) {
      _0x38a680 = "Hangat";
    } else {
      _0x38a680 = "Optimal";
    }
  }
  return {
    cpu: _0x5ea7e0 !== null ? _0x5ea7e0 + "°C" : null,
    cpuTemp: _0x5ea7e0,
    cores: _0x238f66,
    battery: _0x2c1b60 !== null ? _0x2c1b60 + "°C" : null,
    batteryTemp: _0x2c1b60 ? parseFloat(_0x2c1b60) : null,
    status: _0x38a680
  };
}
let lastBatteryCache = null;
let lastBatteryCacheTime = 0;
function getBatteryInfo() {
  if (os.platform() === "win32") {
    return {
      percentage: 100,
      status: "AC Powered",
      temperature: 33,
      voltage: "4.15 V",
      voltageVolts: 4.15,
      current: "0.65 A",
      currentMa: 650,
      watts: 2.7,
      powerWatts: 2.7,
      powerText: "Pengisian: +2.70 W (4.15V • 0.65A)",
      isCharging: true
    };
  }
  const _0x2a3c1e = Date.now();
  if (lastBatteryCache && _0x2a3c1e - lastBatteryCacheTime < 3000) {
    return lastBatteryCache;
  }
  let _0x825394 = null;
  let _0x30d3d1 = null;
  let _0x224d40 = null;
  let _0x138159 = null;
  let _0x4d2eee = null;
  let _0x4f08f0 = false;
  let _0x3caa28 = null;
  try {
    const _0x6e4a98 = "/sys/class/power_supply";
    if (fs.existsSync(_0x6e4a98)) {
      const _0x13f806 = ["battery", "bms", "main", "sec-fuelgauge", "qcom-battery", "smb-battery", "max170xx_battery", "usb", "ac"];
      const _0x2b4165 = fs.readdirSync(_0x6e4a98);
      const _0x3f8658 = _0x2b4165.slice().sort((_0x4654fa, _0x19ae24) => {
        const _0x28202e = _0x13f806.indexOf(_0x4654fa) !== -1 ? _0x13f806.indexOf(_0x4654fa) : 999;
        const _0x520269 = _0x13f806.indexOf(_0x19ae24) !== -1 ? _0x13f806.indexOf(_0x19ae24) : 999;
        return _0x28202e - _0x520269;
      });
      for (let _0x1eb93f = 0; _0x1eb93f < _0x3f8658.length; _0x1eb93f++) {
        const _0x23f7a3 = _0x3f8658[_0x1eb93f];
        const _0x42232d = path.join(_0x6e4a98, _0x23f7a3);
        try {
          const _0x17c17c = path.join(_0x42232d, "capacity");
          if (fs.existsSync(_0x17c17c)) {
            const _0x2ebb46 = parseInt(fs.readFileSync(_0x17c17c, "utf8").trim(), 10);
            if (!isNaN(_0x2ebb46) && _0x2ebb46 >= 0 && _0x2ebb46 <= 100) {
              _0x825394 = _0x2ebb46;
            }
          }
          const _0x421906 = path.join(_0x42232d, "status");
          if (fs.existsSync(_0x421906) && !_0x30d3d1) {
            _0x30d3d1 = fs.readFileSync(_0x421906, "utf8").trim();
          }
          const _0x12537e = path.join(_0x42232d, "temp");
          if (fs.existsSync(_0x12537e) && !_0x224d40) {
            const _0x20bd3f = parseInt(fs.readFileSync(_0x12537e, "utf8").trim(), 10);
            if (!isNaN(_0x20bd3f) && _0x20bd3f > 0) {
              _0x224d40 = (_0x20bd3f > 100 ? _0x20bd3f / 10 : _0x20bd3f).toFixed(1);
            }
          }
          if (_0x138159 === null) {
            const _0x33c544 = ["voltage_now", "batt_vol", "voltage_avg"];
            for (const _0x50669e of _0x33c544) {
              const _0x5c508d = path.join(_0x42232d, _0x50669e);
              if (fs.existsSync(_0x5c508d)) {
                const _0x30f5e8 = parseInt(fs.readFileSync(_0x5c508d, "utf8").trim(), 10);
                if (!isNaN(_0x30f5e8) && _0x30f5e8 > 0) {
                  _0x138159 = _0x30f5e8;
                  break;
                }
              }
            }
          }
          if (_0x4d2eee === null) {
            const _0x485e3a = ["current_now", "batt_current", "current_avg"];
            for (const _0x2f7a56 of _0x485e3a) {
              const _0x410fb1 = path.join(_0x42232d, _0x2f7a56);
              if (fs.existsSync(_0x410fb1)) {
                const _0xd320ff = parseInt(fs.readFileSync(_0x410fb1, "utf8").trim(), 10);
                if (!isNaN(_0xd320ff) && Math.abs(_0xd320ff) > 0 && Math.abs(_0xd320ff) < 20000000) {
                  _0x4d2eee = _0xd320ff;
                  break;
                }
              }
            }
          }
        } catch (_0x1e071d) {}
        if (_0x825394 !== null && _0x138159 !== null && _0x4d2eee !== null) {
          break;
        }
      }
    }
  } catch (_0x3ba65c) {}
  if (!_0x224d40) {
    try {
      if (fs.existsSync("/sys/class/thermal")) {
        const _0x40bf03 = fs.readdirSync("/sys/class/thermal");
        for (const _0x189572 of _0x40bf03) {
          if (!_0x189572.startsWith("thermal_zone")) {
            continue;
          }
          const _0x5f4ae7 = "/sys/class/thermal/" + _0x189572 + "/type";
          const _0x20bb42 = "/sys/class/thermal/" + _0x189572 + "/temp";
          if (fs.existsSync(_0x5f4ae7) && fs.existsSync(_0x20bb42)) {
            const _0x1812ac = fs.readFileSync(_0x5f4ae7, "utf8").trim().toLowerCase();
            if (_0x1812ac.includes("bat") || _0x1812ac.includes("bms")) {
              const _0x5ccb2d = parseInt(fs.readFileSync(_0x20bb42, "utf8").trim(), 10);
              if (!isNaN(_0x5ccb2d) && _0x5ccb2d > 0) {
                _0x224d40 = (_0x5ccb2d > 1000 ? _0x5ccb2d / 1000 : _0x5ccb2d > 100 ? _0x5ccb2d / 10 : _0x5ccb2d).toFixed(1);
                break;
              }
            }
          }
        }
      }
    } catch (_0x39ef29) {}
  }
  if (_0x825394 === null || _0x30d3d1 === null || _0x138159 === null || _0x4d2eee === null) {
    try {
      const _0x173721 = "/data/data/com.termux/files/usr/bin/termux-battery-status";
      const _0x2fa41a = fs.existsSync(_0x173721) ? _0x173721 : "termux-battery-status";
      const _0x20b433 = execSync(_0x2fa41a + " 2>/dev/null", {
        timeout: 1200,
        stdio: ["pipe", "pipe", "ignore"],
        encoding: "utf8"
      }).trim();
      if (_0x20b433 && _0x20b433.startsWith("{")) {
        const _0x52ddbc = JSON.parse(_0x20b433);
        if (_0x52ddbc && typeof _0x52ddbc.percentage === "number") {
          if (_0x825394 === null) {
            _0x825394 = _0x52ddbc.percentage;
          }
          if (!_0x30d3d1 && _0x52ddbc.status) {
            _0x30d3d1 = _0x52ddbc.status;
          }
          if (_0x52ddbc.plugged) {
            _0x3caa28 = _0x52ddbc.plugged;
          }
          if (!_0x224d40 && _0x52ddbc.temperature) {
            _0x224d40 = parseFloat(_0x52ddbc.temperature).toFixed(1);
          }
          if (_0x138159 === null && _0x52ddbc.voltage !== undefined) {
            _0x138159 = Math.abs(parseInt(_0x52ddbc.voltage, 10));
          }
          if (_0x4d2eee === null && _0x52ddbc.current !== undefined) {
            const _0x2798e4 = parseInt(_0x52ddbc.current, 10);
            if (!isNaN(_0x2798e4) && Math.abs(_0x2798e4) > 0 && Math.abs(_0x2798e4) < 20000000) {
              _0x4d2eee = _0x2798e4;
            }
          }
        }
      }
    } catch (_0x1ed53b) {}
  }
  if (_0x825394 === null || _0x30d3d1 === null || _0x138159 === null) {
    try {
      const _0x4a0945 = execSync("dumpsys battery 2>/dev/null || cmd battery get level 2>/dev/null", {
        timeout: 1200,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8"
      });
      if (_0x4a0945) {
        if (_0x825394 === null) {
          const _0x7a26a8 = _0x4a0945.match(/level:\s*([0-9]+)/i);
          if (_0x7a26a8) {
            _0x825394 = parseInt(_0x7a26a8[1], 10);
          } else if (/^[0-9]+$/.test(_0x4a0945.trim())) {
            _0x825394 = parseInt(_0x4a0945.trim(), 10);
          }
        }
        if (!_0x30d3d1) {
          const _0x7fd789 = _0x4a0945.match(/status:\s*([0-9]+)/i);
          if (_0x7fd789) {
            const _0x4fc46c = parseInt(_0x7fd789[1], 10);
            if (_0x4fc46c === 2) {
              _0x30d3d1 = "Charging";
            } else if (_0x4fc46c === 3) {
              _0x30d3d1 = "Discharging";
            } else if (_0x4fc46c === 5) {
              _0x30d3d1 = "Full";
            } else {
              _0x30d3d1 = "In Use";
            }
          }
        }
        if (/AC powered:\s*true/i.test(_0x4a0945)) {
          _0x3caa28 = "AC";
          _0x30d3d1 = _0x30d3d1 || "Charging";
        }
        if (/USB powered:\s*true/i.test(_0x4a0945)) {
          _0x3caa28 = "USB";
          _0x30d3d1 = _0x30d3d1 || "Charging";
        }
        if (!_0x224d40) {
          const _0x4d3d91 = _0x4a0945.match(/temperature:\s*([0-9]+)/i);
          if (_0x4d3d91) {
            const _0x10b2f4 = parseInt(_0x4d3d91[1], 10);
            _0x224d40 = (_0x10b2f4 > 100 ? _0x10b2f4 / 10 : _0x10b2f4).toFixed(1);
          }
        }
        if (_0x138159 === null) {
          const _0x13fcdf = _0x4a0945.match(/voltage:\s*([0-9]+)/i);
          if (_0x13fcdf) {
            _0x138159 = parseInt(_0x13fcdf[1], 10);
          }
        }
        if (_0x4d2eee === null) {
          const _0x4e06bd = _0x4a0945.match(/current\s*now:\s*(-?[0-9]+)/i);
          if (_0x4e06bd) {
            _0x4d2eee = parseInt(_0x4e06bd[1], 10);
          }
        }
      }
    } catch (_0x205e1d) {}
  }
  if (_0x825394 === null) {
    try {
      const _0x357c4c = execSync("getprop sys.battery.level 2>/dev/null", {
        timeout: 500,
        encoding: "utf8"
      }).trim();
      if (/^[0-9]+$/.test(_0x357c4c)) {
        _0x825394 = parseInt(_0x357c4c, 10);
      }
    } catch (_0x54edb5) {}
    if (_0x825394 === null) {
      _0x825394 = 100;
    }
  }
  const _0x3ec9c8 = (_0x30d3d1 || _0x3caa28 || "").toLowerCase();
  _0x4f08f0 = _0x3ec9c8.includes("charg") || _0x3ec9c8.includes("ac") || _0x3ec9c8.includes("usb") || _0x3ec9c8.includes("full") || _0x3ec9c8.includes("plug");
  if (!_0x30d3d1) {
    _0x30d3d1 = _0x4f08f0 ? _0x825394 >= 99 ? "Full" : "Charging" : "Discharging";
  }
  let _0x491ba6 = null;
  if (_0x138159 !== null && _0x138159 > 0) {
    _0x491ba6 = parseFloat((_0x138159 > 100000 ? _0x138159 / 1000000 : _0x138159 > 1000 ? _0x138159 / 1000 : _0x138159).toFixed(2));
  } else {
    _0x491ba6 = parseFloat((3.65 + Math.min(100, Math.max(0, _0x825394)) / 100 * 0.65).toFixed(2));
  }
  let _0x58069d = null;
  let _0x2b8072 = null;
  if (_0x4d2eee !== null) {
    const _0xddd808 = Math.abs(_0x4d2eee);
    if (_0xddd808 > 100000) {
      _0x58069d = parseFloat((_0xddd808 / 1000000).toFixed(2));
    } else if (_0xddd808 > 50) {
      _0x58069d = parseFloat((_0xddd808 / 1000).toFixed(2));
    }
    if (_0x58069d && _0x58069d > 0) {
      _0x2b8072 = parseFloat((_0x491ba6 * _0x58069d).toFixed(2));
    }
  }
  if (_0x2b8072 === null || _0x2b8072 === 0 || _0x58069d === null || _0x58069d === 0) {
    let _0x14b4e7 = 0.15;
    try {
      const _0x272a4a = os.loadavg();
      const _0x15b0a8 = Math.max(os.cpus().length || 4, 1);
      if (_0x272a4a && _0x272a4a[0] !== undefined) {
        _0x14b4e7 = Math.min(Math.max(_0x272a4a[0] / _0x15b0a8, 0.05), 1);
      }
    } catch (_0x5824a8) {}
    if (_0x4f08f0) {
      if (_0x825394 < 70) {
        _0x2b8072 = parseFloat((7.8 + _0x14b4e7 * 2.2).toFixed(2));
      } else if (_0x825394 < 85) {
        _0x2b8072 = parseFloat((5.2 + _0x14b4e7 * 1.5).toFixed(2));
      } else if (_0x825394 < 96) {
        _0x2b8072 = parseFloat((2.8 + _0x14b4e7 * 0.8).toFixed(2));
      } else {
        _0x2b8072 = parseFloat((0.95 + _0x14b4e7 * 0.4).toFixed(2));
      }
    } else {
      _0x2b8072 = parseFloat((0.85 + _0x14b4e7 * 2.35).toFixed(2));
    }
    _0x58069d = parseFloat((_0x2b8072 / _0x491ba6).toFixed(2));
  }
  const _0x50fa31 = Math.round(_0x58069d * 1000);
  const _0x58ff87 = _0x491ba6.toFixed(2) + "V";
  const _0x4984ae = _0x58069d.toFixed(2) + "A";
  let _0x54a5e1 = "";
  if (_0x4f08f0) {
    _0x54a5e1 = "Pengisian: +" + _0x2b8072.toFixed(2) + " W (" + _0x58ff87 + " • " + _0x4984ae + ")";
  } else {
    _0x54a5e1 = "Konsumsi: " + _0x2b8072.toFixed(2) + " W (" + _0x58ff87 + " • " + _0x4984ae + ")";
  }
  lastBatteryCache = {
    percentage: _0x825394,
    status: _0x30d3d1,
    temperature: _0x224d40 || 32.5,
    voltage: _0x491ba6.toFixed(2) + " V",
    voltageVolts: _0x491ba6,
    current: _0x58069d.toFixed(2) + " A",
    currentMa: _0x50fa31,
    watts: _0x2b8072,
    powerWatts: _0x2b8072,
    powerText: _0x54a5e1,
    isCharging: _0x4f08f0
  };
  lastBatteryCacheTime = _0x2a3c1e;
  return lastBatteryCache;
}
function parseHumanSize(_0x15ba38) {
  if (!_0x15ba38) {
    return 0;
  }
  const _0x2107dd = _0x15ba38.slice(-1).toUpperCase();
  const _0x1e4b64 = parseFloat(_0x15ba38.slice(0, -1));
  if (isNaN(_0x1e4b64)) {
    return parseInt(_0x15ba38, 10) || 0;
  }
  if (_0x2107dd === "K") {
    return Math.round(_0x1e4b64 * 1024);
  }
  if (_0x2107dd === "M") {
    return Math.round(_0x1e4b64 * 1024 * 1024);
  }
  if (_0x2107dd === "G") {
    return Math.round(_0x1e4b64 * 1024 * 1024 * 1024);
  }
  if (_0x2107dd === "T") {
    return Math.round(_0x1e4b64 * 1024 * 1024 * 1024 * 1024);
  }
  return Math.round(parseFloat(_0x15ba38)) || 0;
}
function parseDiskLine(_0x43a80e) {
  const _0x1e1478 = _0x43a80e.trim().split(/\s+/);
  if (_0x1e1478.length < 4) {
    return null;
  }
  const _0x55fd43 = _0x1e1478[_0x1e1478.length - 1].startsWith("/") ? _0x1e1478[_0x1e1478.length - 1] : _0x1e1478[0];
  const _0x4bc751 = /[KMGT]$/i.test(_0x1e1478[1]) || /[KMGT]$/i.test(_0x1e1478[2]) || /[KMGT]$/i.test(_0x1e1478[3]);
  let _0x321143 = 0;
  let _0x257795 = 0;
  let _0x9db0a7 = 0;
  if (_0x4bc751) {
    _0x321143 = parseHumanSize(_0x1e1478[1]);
    _0x257795 = parseHumanSize(_0x1e1478[2]);
    _0x9db0a7 = parseHumanSize(_0x1e1478[3]);
  } else {
    const _0x2e8c57 = parseInt(_0x1e1478[1], 10);
    const _0x39545b = parseInt(_0x1e1478[2], 10);
    const _0x4b628e = parseInt(_0x1e1478[3], 10);
    if (!isNaN(_0x2e8c57) && !isNaN(_0x39545b) && !isNaN(_0x4b628e)) {
      _0x321143 = _0x2e8c57 * 1024;
      _0x257795 = _0x39545b * 1024;
      _0x9db0a7 = _0x4b628e * 1024;
    }
  }
  if (_0x321143 > 0) {
    const _0x517791 = Math.min(100, Math.max(0, Math.round(_0x257795 / _0x321143 * 100)));
    const _0x17bef4 = {
      mount: _0x55fd43,
      totalBytes: _0x321143,
      usedBytes: _0x257795,
      freeBytes: _0x9db0a7,
      usagePercent: _0x517791
    };
    return _0x17bef4;
  }
  return null;
}
function getDiskInfo() {
  const _0x33d0f7 = [];
  try {
    if (os.platform() === "win32") {
      const _0x3dcd68 = execSync("wmic logicaldisk get caption,freespace,size 2>nul", {
        timeout: 2000
      }).toString().trim();
      const _0x5213c1 = _0x3dcd68.split("\n").map(_0x335a3f => _0x335a3f.trim()).filter(_0x5ef740 => _0x5ef740 && !_0x5ef740.startsWith("Caption"));
      for (const _0x2a0b89 of _0x5213c1) {
        const _0x385d12 = _0x2a0b89.split(/\s+/);
        if (_0x385d12.length >= 3) {
          const _0x5afa30 = parseInt(_0x385d12[2], 10);
          const _0x259803 = parseInt(_0x385d12[1], 10);
          const _0x58ff94 = _0x5afa30 - _0x259803;
          _0x33d0f7.push({
            mount: _0x385d12[0],
            totalBytes: _0x5afa30,
            freeBytes: _0x259803,
            usedBytes: _0x58ff94,
            usagePercent: _0x5afa30 ? Math.round(_0x58ff94 / _0x5afa30 * 100) : 0
          });
        }
      }
      return _0x33d0f7;
    }
    const _0x39dc46 = ["df -k /data", "df -k", "df /data", "df", "df \"" + (process.env.HOME || ".") + "\""];
    let _0x46641c = "";
    for (let _0x3e9cf2 = 0; _0x3e9cf2 < _0x39dc46.length; _0x3e9cf2++) {
      try {
        _0x46641c = execSync(_0x39dc46[_0x3e9cf2] + " 2>/dev/null", {
          timeout: 1500
        }).toString().trim();
        if (_0x46641c) {
          break;
        }
      } catch {}
    }
    if (_0x46641c) {
      const _0x21e4f8 = _0x46641c.split("\n");
      for (let _0x321027 = 1; _0x321027 < _0x21e4f8.length; _0x321027++) {
        const _0x5c9970 = _0x21e4f8[_0x321027].trim();
        if (!_0x5c9970) {
          continue;
        }
        const _0x317905 = parseDiskLine(_0x5c9970);
        if (_0x317905) {
          const _0x3975c0 = _0x317905.mount;
          if (_0x3975c0.includes("/data") || _0x3975c0.includes("storage") || _0x3975c0.includes("sdcard") || _0x3975c0 === "/" || _0x33d0f7.length === 0) {
            if (!_0x33d0f7.some(_0x2a644c => _0x2a644c.mount === _0x317905.mount)) {
              _0x33d0f7.push(_0x317905);
            }
          }
        }
      }
    }
  } catch {}
  return _0x33d0f7;
}
let prevCpuSample = null;
function getCpuUsagePercent() {
  try {
    if (fs.existsSync("/proc/stat")) {
      const _0x4cf2c1 = fs.readFileSync("/proc/stat", "utf8");
      const _0x16b307 = _0x4cf2c1.split("\n")[0];
      const _0x2af33b = _0x16b307.trim().split(/\s+/).slice(1).map(Number);
      if (_0x2af33b.length >= 4) {
        const _0x3e63ed = (_0x2af33b[3] || 0) + (_0x2af33b[4] || 0);
        const _0x4feadc = _0x2af33b.reduce((_0xb215c3, _0x194a02) => _0xb215c3 + _0x194a02, 0);
        if (!prevCpuSample) {
          const _0x2db93c = {
            idle: _0x3e63ed,
            total: _0x4feadc
          };
          prevCpuSample = _0x2db93c;
          return 0;
        }
        const _0x56b3fa = _0x3e63ed - prevCpuSample.idle;
        const _0x2d1403 = _0x4feadc - prevCpuSample.total;
        const _0x585f2e = {
          idle: _0x3e63ed,
          total: _0x4feadc
        };
        prevCpuSample = _0x585f2e;
        if (_0x2d1403 <= 0) {
          return 0;
        }
        const _0x2fea4e = Math.round((1 - _0x56b3fa / _0x2d1403) * 100);
        return Math.max(0, Math.min(100, _0x2fea4e));
      }
    } else if (os.cpus && os.cpus().length) {
      const _0x46fa85 = os.cpus();
      let _0x2c3384 = 0;
      let _0x42bdcd = 0;
      for (const _0x1767fa of _0x46fa85) {
        for (const _0x4fa646 in _0x1767fa.times) {
          _0x42bdcd += _0x1767fa.times[_0x4fa646];
        }
        _0x2c3384 += _0x1767fa.times.idle;
      }
      if (!prevCpuSample) {
        const _0x7ffa98 = {
          idle: _0x2c3384,
          total: _0x42bdcd
        };
        prevCpuSample = _0x7ffa98;
        return 0;
      }
      const _0x4fb6d0 = _0x2c3384 - prevCpuSample.idle;
      const _0x201930 = _0x42bdcd - prevCpuSample.total;
      const _0xcc3581 = {
        idle: _0x2c3384,
        total: _0x42bdcd
      };
      prevCpuSample = _0xcc3581;
      if (_0x201930 <= 0) {
        return 0;
      }
      return Math.max(0, Math.min(100, Math.round((1 - _0x4fb6d0 / _0x201930) * 100)));
    }
  } catch (_0x47bf4c) {}
  return 0;
}
function getSystemStats() {
  let _0xbeb4c1 = os.totalmem();
  let _0x2c6c79 = os.freemem();
  if (os.platform() !== "win32") {
    try {
      const _0x4a912d = fs.readFileSync("/proc/meminfo", "utf8");
      let _0x21d98e = null;
      let _0x1a7ac2 = null;
      const _0x2866f0 = _0x4a912d.split("\n");
      for (let _0x49a2ad = 0; _0x49a2ad < _0x2866f0.length; _0x49a2ad++) {
        const _0x28e917 = _0x2866f0[_0x49a2ad];
        if (_0x28e917.startsWith("MemTotal:")) {
          const _0x3acb56 = parseInt(_0x28e917.replace(/\D/g, ""), 10);
          if (!isNaN(_0x3acb56)) {
            _0x1a7ac2 = _0x3acb56 * 1024;
          }
        } else if (_0x28e917.startsWith("MemAvailable:")) {
          const _0x25954e = parseInt(_0x28e917.replace(/\D/g, ""), 10);
          if (!isNaN(_0x25954e)) {
            _0x21d98e = _0x25954e * 1024;
          }
        }
      }
      if (_0x1a7ac2) {
        _0xbeb4c1 = _0x1a7ac2;
      }
      if (_0x21d98e !== null) {
        _0x2c6c79 = _0x21d98e;
      }
    } catch (_0x206983) {}
  }
  const _0x222b70 = Math.max(0, _0xbeb4c1 - _0x2c6c79);
  const _0x526751 = getCpuUsagePercent();
  const _0x20f3f9 = {
    name: "Web Dashboard Panel",
    port: PANEL_PORT,
    status: "running",
    type: "panel"
  };
  const _0x58301d = {
    name: "SSH Server (OpenSSH)",
    port: vpsConfig.port || 2222,
    status: lastVpsRunningState ? "running" : "stopped",
    type: "ssh"
  };
  const _0x25e27f = {
    name: "9Router AI Gateway",
    port: ROUTER_PORT,
    status: lastRouterRunningState ? "running" : "stopped",
    type: "app"
  };
  const _0x37f0c3 = {
    running: lastVpsRunningState
  };
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptimeSeconds: Math.floor(os.uptime()),
    panelUptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memory: {
      totalBytes: _0xbeb4c1,
      usedBytes: _0x222b70,
      freeBytes: _0x2c6c79,
      usagePercent: Math.round(_0x222b70 / _0xbeb4c1 * 100)
    },
    cpu: {
      model: (os.cpus().length || 4) + " Cores (" + os.arch() + ")",
      cores: os.cpus().length || 4,
      loadavg: os.loadavg(),
      usagePercent: _0x526751
    },
    battery: getBatteryInfo(),
    thermal: getThermalInfo(),
    disks: getDiskInfo(),
    network: {
      localIPs: getLocalIPs(),
      publicUrl: currentPublicUrl,
      tunnelStatus: tunnelProcess ? currentPublicUrl ? "connected" : "connecting" : "disabled"
    },
    services: [_0x20f3f9, _0x58301d, {
      name: "Cloudflare Tunnel",
      port: null,
      status: tunnelProcess ? currentPublicUrl ? "running" : "connecting" : "stopped",
      type: "tunnel",
      url: currentPublicUrl
    }, _0x25e27f],
    process: {
      pid: process.pid,
      memoryBytes: process.memoryUsage ? process.memoryUsage().rss : 0,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version
    },
    vps: Object.assign({}, vpsConfig, _0x37f0c3)
  };
}
let vpsConfig = {
  enabled: true,
  distro: "ubuntu",
  username: "root",
  password: "ubuntu123",
  port: 2222,
  publicHost: null,
  publicPort: null,
  publicCommand: null
};
function loadVpsConfig() {
  const _0x189615 = path.join(__dirname, "vps-config.json");
  if (fs.existsSync(_0x189615)) {
    try {
      const _0x2fed1a = JSON.parse(fs.readFileSync(_0x189615, "utf8"));
      vpsConfig = Object.assign(vpsConfig, _0x2fed1a);
    } catch (_0x5a2be2) {
      console.error("Gagal membaca vps-config.json:", _0x5a2be2.message);
    }
  }
}
function saveVpsConfig(_0x35d429) {
  try {
    vpsConfig = Object.assign(vpsConfig, _0x35d429);
    const _0x6671d6 = path.join(__dirname, "vps-config.json");
    const _0x2146c4 = fs.existsSync(_0x6671d6) ? JSON.parse(fs.readFileSync(_0x6671d6, "utf8")) : {};
    const _0x8e421a = Object.assign(_0x2146c4, _0x35d429);
    fs.writeFileSync(_0x6671d6, JSON.stringify(_0x8e421a, null, 2), "utf8");
  } catch (_0x44d994) {}
}
loadVpsConfig();
let lastVpsRunningState = false;
async function checkVpsListeningAsync() {
  lastVpsRunningState = await isPortListening(vpsConfig.port || 2222);
  return lastVpsRunningState;
}
setInterval(checkVpsListeningAsync, 8000);
checkVpsListeningAsync();
function startVpsService() {
  const _0x1210e0 = path.join(BASE_DIR, "start.sh");
  try {
    const _0x29241a = {
      detached: true,
      stdio: "ignore",
      env: process.env
    };
    const _0x2bbb09 = spawn("bash", [_0x1210e0, "vps"], _0x29241a);
    _0x2bbb09.unref();
    setTimeout(() => {
      checkVpsListeningAsync().then(_0x2cbe95 => {
        if (_0x2cbe95) {
          startVpsTunnel();
        }
      });
    }, 2000);
    return {
      ok: true,
      message: "Service SSH Server sedang dijalankan."
    };
  } catch (_0x5ed505) {
    const _0x407d32 = {
      ok: false,
      message: "Gagal menjalankan VPS: " + _0x5ed505.message
    };
    return _0x407d32;
  }
}
function stopVpsService() {
  try {
    if (vpsTunnelProcess) {
      try {
        vpsTunnelProcess.kill("SIGKILL");
      } catch (_0x2cc454) {}
      vpsTunnelProcess = null;
    }
    clearTimeout(vpsTunnelRetryTimer);
    saveVpsConfig({
      publicHost: null,
      publicPort: null,
      publicCommand: null
    });
    if (os.platform() !== "win32") {
      execSync("pkill -9 -f \"tcp@free.pinggy.io\" 2>/dev/null || true");
      execSync("pkill -9 -f \"sshd -p 2222\" 2>/dev/null || pkill -9 -f \"/usr/sbin/sshd\" 2>/dev/null || true");
    }
    lastVpsRunningState = false;
    return {
      ok: true,
      message: "Service SSH Server berhasil dihentikan."
    };
  } catch (_0x477a21) {
    const _0x39fc83 = {
      ok: false,
      message: "Gagal menghentikan VPS: " + _0x477a21.message
    };
    return _0x39fc83;
  }
}
function restartVpsService() {
  stopVpsService();
  return new Promise(_0xd890d0 => {
    setTimeout(() => {
      _0xd890d0(startVpsService());
    }, 1500);
  });
}
function controlScreen(_0x34f298) {
  try {
    const _0x59665f = Object.assign({}, process.env, {
      PATH: "/data/data/com.termux/files/usr/bin:/system/bin:/system/xbin:" + (process.env.PATH || "")
    });
    if (_0x34f298 === "off") {
      if (os.platform() !== "win32") {
        const _0x30d5fe = ["su -c \"input keyevent 26\"", "termux-brightness 0", "settings put global stay_on_while_plugged_in 0", "settings put system screen_off_timeout 5000", "input keyevent 26"];
        const _0x3cbc5e = {
          timeout: 3000,
          env: _0x59665f
        };
        exec(_0x30d5fe.join(" 2>/dev/null; ") + " 2>/dev/null", _0x3cbc5e);
      }
      return {
        ok: true,
        message: "Layar HP dinonaktifkan (mode hemat daya)."
      };
    } else {
      if (os.platform() !== "win32") {
        const _0x414966 = ["su -c \"input keyevent 224 || input keyevent 26\"", "termux-brightness 180", "settings put global stay_on_while_plugged_in 3", "settings put system screen_off_timeout 600000", "input keyevent 224 || input keyevent 26", "am start -n com.termux/.app.TermuxActivity || am start -a android.intent.action.MAIN -c android.intent.category.HOME"];
        const _0x3cdd9e = {
          timeout: 3000,
          env: _0x59665f
        };
        exec(_0x414966.join(" 2>/dev/null; ") + " 2>/dev/null", _0x3cdd9e);
      }
      return {
        ok: true,
        message: "Layar HP diaktifkan kembali."
      };
    }
  } catch (_0x356dc0) {
    const _0x5539c5 = {
      ok: false,
      message: "Gagal mengontrol layar: " + _0x356dc0.message
    };
    return _0x5539c5;
  }
}
let torchState = false;
function controlTorch(_0xbc758b) {
  try {
    const _0x2be236 = _0xbc758b !== undefined ? _0xbc758b === "on" || _0xbc758b === true : !torchState;
    torchState = _0x2be236;
    if (os.platform() !== "win32") {
      execSync("termux-torch " + (torchState ? "on" : "off") + " 2>/dev/null || true", {
        timeout: 2000
      });
    }
    const _0x45857b = {
      ok: true,
      torch: torchState,
      message: "Senter HP " + (torchState ? "dinyalakan" : "dimatikan") + "."
    };
    return _0x45857b;
  } catch (_0x351343) {
    const _0x4549e7 = {
      ok: false,
      message: "Gagal mengontrol senter: " + _0x351343.message
    };
    return _0x4549e7;
  }
}
function triggerVibrate(_0x5b4b50 = 400) {
  try {
    if (os.platform() !== "win32") {
      execSync("termux-vibrate -d " + _0x5b4b50 + " 2>/dev/null || true", {
        timeout: 2000
      });
    }
    return {
      ok: true,
      message: "Getaran dikirim ke perangkat HP."
    };
  } catch (_0x498347) {
    const _0x45f230 = {
      ok: false,
      message: "Gagal menggetarkan HP: " + _0x498347.message
    };
    return _0x45f230;
  }
}
let wakeLockActive = false;
function toggleWakeLock(_0xd30407) {
  try {
    const _0x1d1010 = _0xd30407 !== undefined ? _0xd30407 === "on" || _0xd30407 === true : !wakeLockActive;
    wakeLockActive = _0x1d1010;
    if (os.platform() !== "win32") {
      execSync(wakeLockActive ? "termux-wake-lock 2>/dev/null || true" : "termux-wake-unlock 2>/dev/null || true", {
        timeout: 2000
      });
    }
    const _0x7dfa5c = {
      ok: true,
      active: wakeLockActive,
      message: wakeLockActive ? "Wake-Lock diaktifkan (HP tidak akan sleep)." : "Wake-Lock dinonaktifkan."
    };
    return _0x7dfa5c;
  } catch (_0x570f5d) {
    const _0x6197f5 = {
      ok: false,
      message: "Gagal mengatur wake-lock: " + _0x570f5d.message
    };
    return _0x6197f5;
  }
}
function rebootDevice() {
  setTimeout(() => {
    try {
      if (os.platform() !== "win32") {
        exec("su -c reboot 2>/dev/null || reboot 2>/dev/null");
      }
    } catch (_0x127840) {}
  }, 1000);
  return {
    ok: true,
    message: "Perintah reboot telah dikirim ke perangkat."
  };
}
const ROUTER_DIR = path.join(BASE_DIR, "apps", "9router");
const ROUTER_CLI = path.join(ROUTER_DIR, "node_modules", "9router", "cli.js");
const ROUTER_PID_FILE = path.join(ROUTER_DIR, "9router.pid");
const ROUTER_LOG_FILE = path.join(LOG_DIR, "9router.log");
const ROUTER_PORT = 20128;
let routerInstallTracker = {
  active: false,
  progress: 0,
  step: "",
  logs: [],
  success: false,
  error: null,
  startedAt: null,
  finishedAt: null
};
let lastRouterRunningState = false;
function isRouterInstalled() {
  if (fs.existsSync(ROUTER_CLI)) {
    return true;
  }
  try {
    const _0x322041 = os.platform() === "win32" ? "where 9router" : "which 9router";
    execSync(_0x322041 + " 2>/dev/null", {
      stdio: "pipe"
    });
    return true;
  } catch (_0x341189) {
    return false;
  }
}
function getRouterVersion() {
  try {
    const _0x48b9de = path.join(ROUTER_DIR, "node_modules", "9router", "package.json");
    if (fs.existsSync(_0x48b9de)) {
      const _0x4e5cfc = JSON.parse(fs.readFileSync(_0x48b9de, "utf8"));
      if (_0x4e5cfc && _0x4e5cfc.version) {
        return _0x4e5cfc.version;
      }
    }
  } catch (_0x263005) {}
  return "0.5.112";
}
async function checkRouterListeningAsync() {
  lastRouterRunningState = await isPortListening(ROUTER_PORT);
  return lastRouterRunningState;
}
setInterval(checkRouterListeningAsync, 8000);
checkRouterListeningAsync();
async function start9RouterService() {
  if (await checkRouterListeningAsync()) {
    const _0x20142a = {
      ok: true,
      message: "9Router sudah aktif berjalan di Port " + ROUTER_PORT + "."
    };
    return _0x20142a;
  }
  if (!isRouterInstalled()) {
    return {
      ok: false,
      message: "9Router belum terpasang di server. Silakan pasang terlebih dahulu."
    };
  }
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, {
        recursive: true
      });
    }
    if (!fs.existsSync(ROUTER_DIR)) {
      fs.mkdirSync(ROUTER_DIR, {
        recursive: true
      });
    }
    const _0x11142d = fs.openSync(ROUTER_LOG_FILE, "a");
    const _0x4bd832 = fs.openSync(ROUTER_LOG_FILE, "a");
    let _0x597c5d = ROUTER_CLI;
    let _0x38b741 = ["--max-old-space-size=128", "--optimize-for-size", ROUTER_CLI, "--port", String(ROUTER_PORT), "--no-browser"];
    let _0x430812 = process.execPath;
    if (!fs.existsSync(ROUTER_CLI)) {
      _0x430812 = "9router";
      _0x38b741 = ["--port", String(ROUTER_PORT), "--no-browser"];
    }
    const _0x1b0911 = spawn(_0x430812, _0x38b741, {
      cwd: fs.existsSync(ROUTER_DIR) ? ROUTER_DIR : BASE_DIR,
      detached: true,
      stdio: ["ignore", _0x11142d, _0x4bd832],
      env: Object.assign({}, process.env, {
        PORT: String(ROUTER_PORT),
        NO_BROWSER: "true"
      })
    });
    _0x1b0911.unref();
    try {
      fs.writeFileSync(ROUTER_PID_FILE, String(_0x1b0911.pid), "utf8");
    } catch (_0x4f2756) {}
    for (let _0x2140ab = 0; _0x2140ab < 15; _0x2140ab++) {
      await new Promise(_0x5d1f67 => setTimeout(_0x5d1f67, 600));
      if (await checkRouterListeningAsync()) {
        appendServerLog("9Router berhasil diaktifkan di Port " + ROUTER_PORT + " (PID: " + _0x1b0911.pid + ")", "INFO");
        const _0x27bdd9 = {
          ok: true,
          message: "9Router aktif di Port " + ROUTER_PORT + ".",
          pid: _0x1b0911.pid
        };
        return _0x27bdd9;
      }
    }
    const _0x1b1803 = {
      ok: true,
      message: "9Router dalam proses inisialisasi (PID: " + _0x1b0911.pid + "). Silakan tunggu beberapa detik.",
      pid: _0x1b0911.pid
    };
    return _0x1b1803;
  } catch (_0x13c4b2) {
    appendServerLog("Gagal menjalankan 9Router: " + _0x13c4b2.message, "ERROR");
    const _0xc845a9 = {
      ok: false,
      message: "Gagal menjalankan 9Router: " + _0x13c4b2.message
    };
    return _0xc845a9;
  }
}
async function stop9RouterService() {
  try {
    if (fs.existsSync(ROUTER_PID_FILE)) {
      try {
        const _0x55c17a = parseInt(fs.readFileSync(ROUTER_PID_FILE, "utf8").trim(), 10);
        if (_0x55c17a && !isNaN(_0x55c17a)) {
          process.kill(_0x55c17a, "SIGTERM");
          setTimeout(() => {
            try {
              process.kill(_0x55c17a, "SIGKILL");
            } catch (_0x54f5b1) {}
          }, 1500);
        }
      } catch (_0x51d4fe) {}
      try {
        fs.unlinkSync(ROUTER_PID_FILE);
      } catch (_0x110424) {}
    }
    if (os.platform() !== "win32") {
      execSync("pkill -9 -f \"custom-server.js\" 2>/dev/null || true");
      execSync("pkill -9 -f \"9router\" 2>/dev/null || true");
      execSync("fuser -k " + ROUTER_PORT + "/tcp 2>/dev/null || true");
    } else {
      try {
        const _0x531620 = execSync("netstat -ano | findstr :" + ROUTER_PORT, {
          stdio: "pipe"
        }).toString();
        const _0x488f84 = _0x531620.split("\n");
        for (const _0x390598 of _0x488f84) {
          const _0x2f10a4 = _0x390598.trim().split(/\s+/);
          const _0x4a655d = _0x2f10a4[_0x2f10a4.length - 1];
          if (_0x4a655d && /^\d+$/.test(_0x4a655d)) {
            execSync("taskkill /F /PID " + _0x4a655d + " 2>nul || exit 0");
          }
        }
      } catch (_0x462a19) {}
    }
    lastRouterRunningState = false;
    appendServerLog("9Router dihentikan.", "INFO");
    return {
      ok: true,
      message: "9Router berhasil dihentikan."
    };
  } catch (_0x42d749) {
    const _0x1fecf2 = {
      ok: false,
      message: "Gagal menghentikan 9Router: " + _0x42d749.message
    };
    return _0x1fecf2;
  }
}
async function restart9RouterService() {
  await stop9RouterService();
  await new Promise(_0x51e3e7 => setTimeout(_0x51e3e7, 1200));
  return await start9RouterService();
}
async function delete9RouterService() {
  try {
    await stop9RouterService();
    if (fs.existsSync(ROUTER_DIR)) {
      fs.rmSync(ROUTER_DIR, {
        recursive: true,
        force: true
      });
    }
    const _0x1fc9da = path.join(BASE_DIR, "apps");
    if (!fs.existsSync(_0x1fc9da)) {
      fs.mkdirSync(_0x1fc9da, {
        recursive: true
      });
    }
    fs.writeFileSync(path.join(_0x1fc9da, ".gitkeep"), "", "utf8");
    routerInstallTracker = {
      active: false,
      progress: 0,
      step: "",
      logs: [],
      success: false,
      error: null,
      startedAt: null,
      finishedAt: null
    };
    lastRouterRunningState = false;
    appendServerLog("9Router dan berkas aplikasinya berhasil dihapus bersih.", "INFO");
    return {
      ok: true,
      message: "9Router dan seluruh berkas instalasinya berhasil dihapus."
    };
  } catch (_0x174c48) {
    const _0x371bc2 = {
      ok: false,
      message: "Gagal menghapus 9Router: " + _0x174c48.message
    };
    return _0x371bc2;
  }
}
async function start9RouterInstallJob() {
  if (routerInstallTracker.active) {
    return {
      ok: true,
      message: "Proses instalasi 9Router sedang berlangsung."
    };
  }
  routerInstallTracker = {
    active: true,
    progress: 5,
    step: "Mempersiapkan folder instalasi aplikasi...",
    logs: ["[" + formatLogTimestamp() + "] [INFO] Memulai instalasi 9Router di server..."],
    success: false,
    error: null,
    startedAt: Date.now(),
    finishedAt: null
  };
  (async () => {
    try {
      if (!fs.existsSync(ROUTER_DIR)) {
        fs.mkdirSync(ROUTER_DIR, {
          recursive: true
        });
      }
      routerInstallTracker.progress = 15;
      routerInstallTracker.step = "Menyiapkan package.json aplikasi...";
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] Direktori disiapkan: " + ROUTER_DIR);
      const _0x218f3c = path.join(ROUTER_DIR, "package.json");
      if (!fs.existsSync(_0x218f3c)) {
        fs.writeFileSync(_0x218f3c, JSON.stringify({
          name: "dalang-9router",
          version: "1.0.0",
          private: true,
          description: "9Router instance on DalangStore",
          dependencies: {}
        }, null, 2), "utf8");
      }
      routerInstallTracker.progress = 25;
      routerInstallTracker.step = "Mengunduh dan memasang paket 9router via npm...";
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] Menjalankan: npm install 9router@latest --no-audit --no-fund --prefer-online");
      const _0x4f93fd = os.platform() === "win32" ? "npm.cmd" : "npm";
      const _0x84faff = spawn(_0x4f93fd, ["install", "9router@latest", "--no-audit", "--no-fund", "--prefer-online"], {
        cwd: ROUTER_DIR,
        env: Object.assign({}, process.env, {
          NODE_OPTIONS: "--max-old-space-size=128"
        }),
        shell: true
      });
      let _0x521572 = 25;
      const _0x42af40 = setInterval(() => {
        if (routerInstallTracker.active && _0x521572 < 85) {
          _0x521572 += 3;
          routerInstallTracker.progress = _0x521572;
        }
      }, 1000);
      const _0x3afa64 = _0x186c7d => {
        const _0x1dd7a9 = _0x186c7d.toString();
        const _0x6436a3 = _0x1dd7a9.split("\n").filter(_0x549eec => _0x549eec.trim().length > 0);
        for (const _0x12355b of _0x6436a3) {
          routerInstallTracker.logs.push(_0x12355b);
          if (routerInstallTracker.logs.length > 250) {
            routerInstallTracker.logs.shift();
          }
        }
      };
      _0x84faff.stdout.on("data", _0x3afa64);
      _0x84faff.stderr.on("data", _0x3afa64);
      const _0x3ecfad = await new Promise(_0x22aded => {
        _0x84faff.on("close", _0x22aded);
        _0x84faff.on("error", _0x466b23 => {
          routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] [ERROR] " + _0x466b23.message);
          _0x22aded(1);
        });
      });
      clearInterval(_0x42af40);
      if (_0x3ecfad !== 0) {
        throw new Error("npm install selesai dengan kode error " + _0x3ecfad);
      }
      routerInstallTracker.progress = 88;
      routerInstallTracker.step = "Menyiapkan berkas polyfill & konfigurasi...";
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] Paket 9router berhasil terpasang.");
      const _0x2499c2 = "if (typeof globalThis.File === 'undefined') {\n  try { globalThis.File = require('node:buffer').File; } catch (e) {\n    try { globalThis.File = require('buffer').File; } catch (_) {}\n  }\n}\n";
      fs.writeFileSync(path.join(ROUTER_DIR, "polyfill.js"), _0x2499c2, "utf8");
      routerInstallTracker.progress = 92;
      routerInstallTracker.step = "Menjalankan background service 9Router di Port 20128...";
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] Mengaktifkan layanan 9Router di latar belakang...");
      const _0xb7141a = await start9RouterService();
      if (!_0xb7141a.ok) {
        routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] [WARN] " + _0xb7141a.message);
      }
      routerInstallTracker.progress = 100;
      routerInstallTracker.step = "Instalasi sukses! 9Router siap digunakan.";
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] [SUKSES] 9Router berhasil dipasang dan aktif di Port 20128.");
      routerInstallTracker.success = true;
      routerInstallTracker.active = false;
      routerInstallTracker.finishedAt = Date.now();
    } catch (_0x5cd295) {
      routerInstallTracker.active = false;
      routerInstallTracker.error = _0x5cd295.message;
      routerInstallTracker.step = "Instalasi gagal: " + _0x5cd295.message;
      routerInstallTracker.logs.push("[" + formatLogTimestamp() + "] [ERROR] " + _0x5cd295.message);
    }
  })();
  return {
    ok: true,
    message: "Proses instalasi 9Router berhasil dimulai."
  };
}
function setupVpsCliHelpers() {
  const _0x472bcb = process.env.HOME || (os.platform() === "win32" ? os.homedir() : "/data/data/com.termux/files/home");
  const _0x3b1395 = path.join(_0x472bcb, "ubuntu-fs", "usr", "local", "bin");
  if (fs.existsSync(_0x3b1395)) {
    try {
      const _0x4256ef = "#!/bin/bash\necho \"==========================================\"\necho \"      dalang Mini Server - Live Status      \"\necho \"==========================================\"\ncurl -s -u \"" + authConfig.username + ":" + authConfig.password + "\" http://127.0.0.1:" + PANEL_PORT + "/api/system/stats | python3 -c '\nimport sys, json\ntry:\n    d = json.load(sys.stdin)\n    mem = d.get(\"memory\", {})\n    cpu = d.get(\"cpu\", {})\n    bat = d.get(\"battery\", {})\n    therm = d.get(\"thermal\", {})\n    net = d.get(\"network\", {})\n    print(f\"Uptime: {d.get(\\\"uptimeSeconds\\\", 0)//3600}h {(d.get(\\\"uptimeSeconds\\\", 0)%3600)//60}m\")\n    print(f\"RAM:    {mem.get(\\\"usedBytes\\\", 0)//(1024*1024)}MB / {mem.get(\\\"totalBytes\\\", 0)//(1024*1024)}MB ({mem.get(\\\"usagePercent\\\", 0)}%)\")\n    print(f\"CPU:    {cpu.get(\\\"usagePercent\\\", 0)}%\")\n    print(f\"Suhu:   {therm.get(\\\"cpu\\\", \\\"-\\\")} (SoC) | {therm.get(\\\"battery\\\", \\\"-\\\")} (Baterai) [{therm.get(\\\"status\\\", \\\"-\\\")}]\")\n    print(f\"Power:  {bat.get(\\\"percentage\\\", \\\"-\\\")}% ({bat.get(\\\"status\\\", \\\"-\\\")})\")\n    print(f\"Web:    {net.get(\\\"publicUrl\\\") or \\\"Connecting...\\\"}\")\nexcept Exception as e:\n    print(\"Gagal parse stats:\", e)\n' 2>/dev/null || curl -s -u \"" + authConfig.username + ":" + authConfig.password + "\" http://127.0.0.1:" + PANEL_PORT + "/api/system/stats\necho \"==========================================\"\n";
      fs.writeFileSync(path.join(_0x3b1395, "panel-status"), _0x4256ef, {
        mode: 493
      });
      const _0x4c520c = "#!/bin/bash\necho \">> Mengirim sinyal restart ke Server Panel...\"\ncurl -s -X POST -u \"" + authConfig.username + ":" + authConfig.password + "\" http://127.0.0.1:" + PANEL_PORT + "/api/restart-panel\necho \"\"\necho \">> Panel sedang dimulai ulang di latar belakang.\"\n";
      fs.writeFileSync(path.join(_0x3b1395, "panel-restart"), _0x4c520c, {
        mode: 493
      });
      const _0x282dd9 = "#!/bin/bash\necho \">> [VPS Fix] Membersihkan lock file dan memperbaiki konfigurasi paket...\"\nrm -f /var/lib/dpkg/lock* /var/lib/apt/lists/lock /var/cache/apt/archives/lock 2>/dev/null || true\necho -e '#!/bin/sh\\nexit 101' > /usr/sbin/policy-rc.d\nchmod +x /usr/sbin/policy-rc.d\nif [ -d /var/lib/dpkg/info ]; then\n  for f in /var/lib/dpkg/info/*.postinst; do\n    [ -f \"$f\" ] && sed -i '1s|^|exit 0\\n|' \"$f\" 2>/dev/null || true\n  done\nfi\nexport DEBIAN_FRONTEND=noninteractive\ndpkg --configure -a 2>/dev/null || true\napt-get install -f -y 2>/dev/null || true\napt-get update -y 2>/dev/null || true\necho \"✓ Sistem paket Ubuntu VPS siap!\"\n";
      fs.writeFileSync(path.join(_0x3b1395, "vps-fix"), _0x282dd9, {
        mode: 493
      });
      const _0x5a330b = "#!/bin/bash\nif [ $# -eq 0 ]; then\n  echo \"Penggunaan: vps-install <nama-paket>\"\n  exit 1\nfi\nrm -f /var/lib/dpkg/lock* /var/lib/apt/lists/lock /var/cache/apt/archives/lock 2>/dev/null || true\nexport DEBIAN_FRONTEND=noninteractive\napt-get install -y --no-install-recommends \"$@\" || true\necho \"✓ Instalasi selesai!\"\n";
      fs.writeFileSync(path.join(_0x3b1395, "vps-install"), _0x5a330b, {
        mode: 493
      });
    } catch (_0x309a4e) {}
  }
}
let currentPublicUrl = null;
try {
  const savedTunnelFile = path.join(LOG_DIR, "tunnel-url.txt");
  if (fs.existsSync(savedTunnelFile)) {
    const saved = fs.readFileSync(savedTunnelFile, "utf8").trim();
    if (saved.startsWith("http")) {
      currentPublicUrl = saved;
    }
  }
} catch (_0x4a9a97) {}
let tunnelProcess = null;
let tunnelRetryTimer = null;
let tunnelFailCount = 0;
let vpsTunnelProcess = null;
let vpsTunnelRetryTimer = null;
let vpsFailCount = 0;
function findCloudflaredBin() {
  const _0xbb5554 = process.env.PREFIX || "/data/data/com.termux/files/usr";
  const _0x3e78d3 = process.env.HOME || "/data/data/com.termux/files/home";
  const _0x54ae39 = [path.join(_0xbb5554, "bin", "cloudflared"), "/data/data/com.termux/files/usr/bin/cloudflared", path.join(_0x3e78d3, "ubuntu-fs", "usr", "local", "bin", "cloudflared"), path.join(_0x3e78d3, "ubuntu-fs", "usr", "bin", "cloudflared"), "/usr/local/bin/cloudflared", "/usr/bin/cloudflared"];
  for (let _0x232f53 = 0; _0x232f53 < _0x54ae39.length; _0x232f53++) {
    if (fs.existsSync(_0x54ae39[_0x232f53])) {
      return _0x54ae39[_0x232f53];
    }
  }
  try {
    const _0x5b61a3 = execSync("command -v cloudflared 2>/dev/null", {
      timeout: 1000
    }).toString().trim();
    if (_0x5b61a3) {
      return _0x5b61a3;
    }
  } catch (_0x146a6a) {}
  return null;
}
function startPublicTunnel() {
  if (process.env.DALANG_ENABLE_TUNNEL === "0" || process.env.DALANG_ENABLE_TUNNEL === "false") {
    return;
  }
  if (tunnelProcess) {
    return;
  }
  const _0x17ebf8 = findCloudflaredBin();
  if (!_0x17ebf8) {
    startFallbackSshTunnel();
    return;
  }
  try {
    const _0x29d5a4 = {
      ...process.env
    };
    _0x29d5a4.GOGC = "20";
    _0x29d5a4.GOMEMLIMIT = "32MiB";
    const _0x40fd35 = {
      stdio: ["ignore", "pipe", "pipe"],
      env: _0x29d5a4
    };
    tunnelProcess = spawn(_0x17ebf8, ["tunnel", "--url", "http://127.0.0.1:" + PANEL_PORT], _0x40fd35);
    let _0xd4d41c = "";
    const _0x508768 = _0x562672 => {
      _0xd4d41c += _0x562672.toString();
      if (_0xd4d41c.length > 3000) {
        _0xd4d41c = _0xd4d41c.slice(-1500);
      }
      const _0x1c88eb = _0xd4d41c.match(/https:\/\/(?!api\.)[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (_0x1c88eb && _0x1c88eb[0] !== currentPublicUrl) {
        currentPublicUrl = _0x1c88eb[0];
        tunnelFailCount = 0;
        console.log("🌐 Web Tunnel Aktif: " + currentPublicUrl);
        try {
          fs.writeFileSync(path.join(LOG_DIR, "tunnel-url.txt"), currentPublicUrl, "utf8");
        } catch (_0x44fbd0) {}
      }
    };
    tunnelProcess.stdout.on("data", _0x508768);
    tunnelProcess.stderr.on("data", _0x508768);
    let _0x1f0c43 = false;
    tunnelProcess.on("close", () => {
      if (_0x1f0c43) {
        return;
      }
      tunnelProcess = null;
      currentPublicUrl = null;
      tunnelFailCount++;
      const _0xdfe650 = Math.min(60000, tunnelFailCount * 8000);
      clearTimeout(tunnelRetryTimer);
      tunnelRetryTimer = setTimeout(startPublicTunnel, _0xdfe650);
    });
    tunnelProcess.on("error", () => {
      _0x1f0c43 = true;
      tunnelProcess = null;
      clearTimeout(tunnelRetryTimer);
      startFallbackSshTunnel();
    });
  } catch (_0x48e9a1) {
    startFallbackSshTunnel();
  }
}
function startFallbackSshTunnel() {
  if (tunnelProcess) {
    return;
  }
  const _0x5b87cd = "ssh";
  const _0x413f56 = ["-p", "443", "-o", "BatchMode=yes", "-o", "PasswordAuthentication=no", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "-o", "ConnectTimeout=10", "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=3", "-o", "LogLevel=ERROR", "-R0:127.0.0.1:" + PANEL_PORT, "free.pinggy.io"];
  try {
    tunnelProcess = spawn(_0x5b87cd, _0x413f56, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let _0x1624c7 = "";
    const _0x16531d = _0x1c9677 => {
      _0x1624c7 += _0x1c9677.toString();
      if (_0x1624c7.length > 3000) {
        _0x1624c7 = _0x1624c7.slice(-1500);
      }
      const _0x202a1c = _0x1624c7.match(/https:\/\/(?:[a-zA-Z0-9-._]+\.pinggy\.(?:link|online|io)|[a-zA-Z0-9-._]+\.free\.pinggy\.link|[a-zA-Z0-9-._]+\.a\.pinggy\.link|(?!api\.)[a-zA-Z0-9-]+\.trycloudflare\.com)/);
      if (_0x202a1c && _0x202a1c[0] !== currentPublicUrl) {
        currentPublicUrl = _0x202a1c[0];
        tunnelFailCount = 0;
        console.log("🌐 Web Tunnel Aktif (Fallback Pinggy): " + currentPublicUrl);
        try {
          fs.writeFileSync(path.join(LOG_DIR, "tunnel-url.txt"), currentPublicUrl, "utf8");
        } catch (_0x5e01b6) {}
      }
    };
    tunnelProcess.stdout.on("data", _0x16531d);
    tunnelProcess.stderr.on("data", _0x16531d);
    tunnelProcess.on("close", () => {
      tunnelProcess = null;
      currentPublicUrl = null;
      tunnelFailCount++;
      const _0x5135b8 = Math.min(60000, tunnelFailCount * 10000);
      clearTimeout(tunnelRetryTimer);
      tunnelRetryTimer = setTimeout(startPublicTunnel, _0x5135b8);
    });
    tunnelProcess.on("error", () => {
      tunnelProcess = null;
      clearTimeout(tunnelRetryTimer);
      tunnelRetryTimer = setTimeout(startPublicTunnel, 15000);
    });
  } catch (_0x39e96b) {}
}
async function startVpsTunnel() {
  if (vpsTunnelProcess) {
    return;
  }
  loadVpsConfig();
  const _0x2a9fb3 = vpsConfig.port || 2222;
  const _0x58b23d = await isPortListening(_0x2a9fb3);
  if (!_0x58b23d) {
    clearTimeout(vpsTunnelRetryTimer);
    vpsTunnelRetryTimer = setTimeout(startVpsTunnel, 45000);
    return;
  }
  if (os.platform() !== "win32") {
    try {
      execSync("pkill -f \"tcp@free.pinggy.io\" 2>/dev/null || true");
    } catch (_0x49e624) {}
  }
  const _0x5dbafc = "ssh";
  const _0x58c55b = ["-p", "443", "-o", "BatchMode=yes", "-o", "PasswordAuthentication=no", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "-o", "ConnectTimeout=10", "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=3", "-o", "LogLevel=ERROR", "-R0:127.0.0.1:" + _0x2a9fb3, "tcp@free.pinggy.io"];
  try {
    vpsTunnelProcess = spawn(_0x5dbafc, _0x58c55b, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let _0x2232c0 = "";
    const _0x3f679e = _0x2045b1 => {
      _0x2232c0 += _0x2045b1.toString();
      if (_0x2232c0.length > 2048) {
        _0x2232c0 = _0x2232c0.slice(-1024);
      }
      const _0xeb5e4a = _0x2232c0.match(/(?:tcp:\/\/|ssh\s+-p\s+)([a-zA-Z0-9-._]+)(?::|\s+)([0-9]+)/i) || _0x2232c0.match(/([a-zA-Z0-9-._]+\.pinggy\.(?:link|online)):([0-9]+)/i);
      if (_0xeb5e4a) {
        const _0x509891 = _0xeb5e4a[1];
        const _0x5470f9 = _0xeb5e4a[2];
        const _0x1b5789 = "ssh " + vpsConfig.username + "@" + _0x509891 + " -p " + _0x5470f9;
        if (vpsConfig.publicPort !== _0x5470f9 || vpsConfig.publicHost !== _0x509891 || vpsConfig.publicCommand !== _0x1b5789) {
          vpsConfig.publicHost = _0x509891;
          vpsConfig.publicPort = _0x5470f9;
          vpsConfig.publicCommand = _0x1b5789;
          vpsFailCount = 0;
          console.log("🖥 VPS SSH Publik Aktif: " + vpsConfig.publicCommand);
          const _0x16c033 = {
            publicHost: _0x509891,
            publicPort: _0x5470f9,
            publicCommand: _0x1b5789
          };
          saveVpsConfig(_0x16c033);
        }
      }
    };
    vpsTunnelProcess.stdout.on("data", _0x3f679e);
    vpsTunnelProcess.stderr.on("data", _0x3f679e);
    vpsTunnelProcess.on("close", () => {
      vpsTunnelProcess = null;
      saveVpsConfig({
        publicHost: null,
        publicPort: null,
        publicCommand: null
      });
      vpsFailCount++;
      const _0xaf569c = Math.min(60000, vpsFailCount * 12000);
      clearTimeout(vpsTunnelRetryTimer);
      vpsTunnelRetryTimer = setTimeout(startVpsTunnel, _0xaf569c);
    });
    vpsTunnelProcess.on("error", () => {
      vpsTunnelProcess = null;
      clearTimeout(vpsTunnelRetryTimer);
      vpsTunnelRetryTimer = setTimeout(startVpsTunnel, 20000);
    });
  } catch (_0x7d261c) {}
}
const DEFAULT_ROOT_DIR = BASE_DIR;
function resolveSafePath(_0x2954b1) {
  if (_0x2954b1) {
    return path.resolve(_0x2954b1);
  } else {
    return DEFAULT_ROOT_DIR;
  }
}
function listDirectory(_0xd19c7a) {
  const _0x5878bc = resolveSafePath(_0xd19c7a);
  if (!fs.existsSync(_0x5878bc)) {
    throw new Error("Direktori tidak ditemukan: " + _0x5878bc);
  }
  const _0x3b2442 = fs.statSync(_0x5878bc);
  if (!_0x3b2442.isDirectory()) {
    throw new Error("Path bukan direktori: " + _0x5878bc);
  }
  const _0x37137b = fs.readdirSync(_0x5878bc, {
    withFileTypes: true
  });
  const _0x26cf84 = [];
  for (const _0x43f70e of _0x37137b) {
    const _0x5925b4 = path.join(_0x5878bc, _0x43f70e.name);
    try {
      const _0x4c6e79 = fs.statSync(_0x5925b4);
      _0x26cf84.push({
        name: _0x43f70e.name,
        path: _0x5925b4.replace(/\\/g, "/"),
        isDir: _0x43f70e.isDirectory(),
        sizeBytes: _0x43f70e.isDirectory() ? null : _0x4c6e79.size,
        modifiedAt: _0x4c6e79.mtime.toISOString()
      });
    } catch {}
  }
  _0x26cf84.sort((_0x58fde1, _0x4209c2) => {
    if (_0x58fde1.isDir && !_0x4209c2.isDir) {
      return -1;
    }
    if (!_0x58fde1.isDir && _0x4209c2.isDir) {
      return 1;
    }
    return _0x58fde1.name.localeCompare(_0x4209c2.name);
  });
  return {
    currentPath: _0x5878bc.replace(/\\/g, "/"),
    parentPath: path.dirname(_0x5878bc).replace(/\\/g, "/"),
    homeDir: (process.env.HOME || BASE_DIR).replace(/\\/g, "/"),
    serverDir: BASE_DIR.replace(/\\/g, "/"),
    items: _0x26cf84
  };
}
function handleStreamingUpload(_0x4a44b5, _0x4306a1, _0x220b8a) {
  let _0x2b87f0 = false;
  const _0x338f82 = (_0x3a0842, _0x22afe4) => {
    if (_0x2b87f0) {
      return;
    }
    _0x2b87f0 = true;
    _0x220b8a(_0x3a0842, _0x22afe4);
  };
  const _0xcbaacd = _0x4a44b5.headers["content-type"] || "";
  const _0x70ba4a = _0xcbaacd.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!_0x70ba4a) {
    return _0x338f82(new Error("Boundary multipart tidak ditemukan"));
  }
  const _0x999be3 = _0x70ba4a[1] || _0x70ba4a[2];
  const _0x268b9f = Buffer.from("--" + _0x999be3);
  let _0x51bbdf = "WAIT_BOUNDARY";
  let _0x247a4a = Buffer.alloc(0);
  let _0x35cf76 = null;
  let _0x2a7210 = [];
  const _0x36b733 = [];
  _0x4a44b5.on("data", _0x2fbbaf => {
    try {
      _0x247a4a = Buffer.concat([_0x247a4a, _0x2fbbaf]);
      let _0x4e2047 = true;
      while (_0x4e2047) {
        if (_0x51bbdf === "WAIT_BOUNDARY") {
          const _0x4801f4 = _0x247a4a.indexOf(_0x268b9f);
          if (_0x4801f4 === -1) {
            _0x4e2047 = false;
            break;
          }
          _0x247a4a = _0x247a4a.slice(_0x4801f4 + _0x268b9f.length);
          _0x51bbdf = "WAIT_HEADER";
        } else if (_0x51bbdf === "WAIT_HEADER") {
          if (_0x247a4a.length >= 2 && _0x247a4a[0] === 45 && _0x247a4a[1] === 45) {
            _0x4e2047 = false;
            break;
          }
          const _0x5a912b = _0x247a4a.indexOf(Buffer.from("\r\n\r\n"));
          if (_0x5a912b === -1) {
            _0x4e2047 = false;
            break;
          }
          const _0x45613b = _0x247a4a.slice(0, _0x5a912b).toString("utf8");
          _0x247a4a = _0x247a4a.slice(_0x5a912b + 4);
          const _0x102f60 = _0x45613b.match(/filename="([^"]+)"/i);
          if (_0x102f60) {
            const _0x438e38 = _0x102f60[1].replace(/\\/g, "/");
            const _0x34ec70 = path.normalize(_0x438e38).replace(/^(\.\.[\/\\])+/, "").replace(/^[\/\\]+/, "");
            const _0x361d3a = path.resolve(_0x4306a1, _0x34ec70);
            if (!_0x361d3a.startsWith(path.resolve(_0x4306a1))) {
              throw new Error("Akses direktori tidak sah");
            }
            const _0x2e9935 = path.dirname(_0x361d3a);
            if (!fs.existsSync(_0x2e9935)) {
              fs.mkdirSync(_0x2e9935, {
                recursive: true
              });
            }
            const _0x28d118 = fs.createWriteStream(_0x361d3a);
            _0x36b733.push(new Promise((_0x2058c4, _0x4921bf) => {
              _0x28d118.on("finish", _0x2058c4);
              _0x28d118.on("error", _0x5c3a5d => {
                try {
                  _0x28d118.destroy();
                } catch (_0x35b7ac) {}
                _0x4921bf(_0x5c3a5d);
              });
            }));
            _0x35cf76 = _0x28d118;
            _0x2a7210.push(_0x34ec70);
            _0x51bbdf = "READ_FILE_DATA";
          } else {
            _0x51bbdf = "READ_FIELD_DATA";
          }
        } else if (_0x51bbdf === "READ_FILE_DATA") {
          const _0x57f234 = _0x247a4a.indexOf(_0x268b9f);
          if (_0x57f234 === -1) {
            if (_0x247a4a.length > _0x268b9f.length + 4) {
              const _0x15a617 = _0x247a4a.length - (_0x268b9f.length + 4);
              const _0x3548e1 = _0x247a4a.slice(0, _0x15a617);
              _0x35cf76.write(_0x3548e1);
              _0x247a4a = _0x247a4a.slice(_0x15a617);
            }
            _0x4e2047 = false;
          } else {
            let _0x2d22b3 = _0x57f234;
            if (_0x2d22b3 >= 2 && _0x247a4a[_0x2d22b3 - 2] === 13 && _0x247a4a[_0x2d22b3 - 1] === 10) {
              _0x2d22b3 -= 2;
            }
            const _0x987b21 = _0x247a4a.slice(0, _0x2d22b3);
            _0x35cf76.end(_0x987b21);
            _0x35cf76 = null;
            _0x247a4a = _0x247a4a.slice(_0x57f234 + _0x268b9f.length);
            _0x51bbdf = "WAIT_HEADER";
          }
        } else if (_0x51bbdf === "READ_FIELD_DATA") {
          const _0x25e027 = _0x247a4a.indexOf(_0x268b9f);
          if (_0x25e027 === -1) {
            _0x247a4a = Buffer.alloc(0);
            _0x4e2047 = false;
          } else {
            _0x247a4a = _0x247a4a.slice(_0x25e027 + _0x268b9f.length);
            _0x51bbdf = "WAIT_HEADER";
          }
        }
      }
    } catch (_0x8ecb2c) {
      if (_0x35cf76) {
        try {
          _0x35cf76.destroy();
        } catch (_0x334bcf) {}
        _0x35cf76 = null;
      }
      _0x338f82(_0x8ecb2c);
    }
  });
  _0x4a44b5.on("end", () => {
    if (_0x35cf76) {
      try {
        _0x35cf76.end();
      } catch (_0x593d30) {}
    }
    Promise.all(_0x36b733).then(() => _0x338f82(null, _0x2a7210)).catch(_0x1d7137 => _0x338f82(_0x1d7137));
  });
  _0x4a44b5.on("error", _0x42d1a7 => {
    if (_0x35cf76) {
      try {
        _0x35cf76.destroy();
      } catch (_0x3d3045) {}
    }
    _0x338f82(_0x42d1a7);
  });
}
function sendJSON(_0x2ebc0f, _0x131f17, _0x111ebe) {
  const _0x43d9b7 = JSON.stringify(_0x111ebe);
  _0x2ebc0f.writeHead(_0x131f17, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache"
  });
  _0x2ebc0f.end(_0x43d9b7);
}
function parseJSONBody(_0x365148, _0x7a8edc = 5242880) {
  return new Promise((_0x315406, _0x156e4e) => {
    let _0x74725d = "";
    let _0x102b85 = 0;
    _0x365148.on("data", _0x249e58 => {
      _0x102b85 += _0x249e58.length;
      if (_0x102b85 > _0x7a8edc) {
        _0x365148.destroy();
        _0x156e4e(new Error("Payload JSON terlalu besar (maksimal 5MB)"));
        return;
      }
      _0x74725d += _0x249e58;
    });
    _0x365148.on("end", () => {
      try {
        _0x315406(_0x74725d && _0x74725d.trim() ? JSON.parse(_0x74725d) : {});
      } catch (_0x2e66af) {
        _0x156e4e(new Error("Format JSON tidak valid: " + _0x2e66af.message));
      }
    });
    _0x365148.on("error", _0x156e4e);
  });
}
const parseBody = parseJSONBody;
function getPm2Status() {
  let _0x3f1326 = false;
  try {
    execSync("pm2 -v", {
      timeout: 2000,
      stdio: "ignore"
    });
    _0x3f1326 = true;
  } catch (_0x5d3c8f) {}
  if (!_0x3f1326) {
    return {
      installed: false,
      running: false,
      available: false,
      processes: [],
      message: "PM2 tidak terpasang di sistem."
    };
  }
  try {
    const _0x50e567 = execSync("pm2 jlist 2>/dev/null", {
      timeout: 3000
    }).toString();
    const _0x3bb6c2 = JSON.parse(_0x50e567);
    if (Array.isArray(_0x3bb6c2)) {
      return {
        installed: true,
        running: true,
        available: true,
        processes: _0x3bb6c2.map(_0x3521d2 => {
          const _0x5eb13b = _0x3521d2.pm2_env || {};
          const _0x537ebc = _0x3521d2.monit || {};
          return {
            pm_id: _0x3521d2.pm_id,
            name: _0x3521d2.name || "app",
            pid: _0x3521d2.pid || "-",
            status: _0x5eb13b.status || "unknown",
            uptimeMs: _0x5eb13b.pm_uptime ? Date.now() - _0x5eb13b.pm_uptime : 0,
            restarts: _0x5eb13b.restart_time || 0,
            memory: _0x537ebc.memory || 0,
            memoryBytes: _0x537ebc.memory || 0,
            cpu: _0x537ebc.cpu || 0,
            cpuPercent: _0x537ebc.cpu || 0
          };
        })
      };
    }
  } catch (_0x606eba) {}
  return {
    installed: true,
    running: false,
    available: true,
    processes: [],
    message: "PM2 terpasang, namun belum ada proses yang berjalan."
  };
}
const activeSockets = new Set();
function getPm2Logs(_0x26bcf1, _0x435d92 = 100) {
  try {
    const _0x41d5d1 = _0x26bcf1 ? String(_0x26bcf1).replace(/[^a-zA-Z0-9_.-]/g, "") : "";
    const _0x42a1c9 = _0x41d5d1 ? "pm2 logs \"" + _0x41d5d1 + "\" --lines " + _0x435d92 + " --nostream 2>&1" : "pm2 logs --lines " + _0x435d92 + " --nostream 2>&1";
    const _0x1a1039 = execSync(_0x42a1c9, {
      timeout: 3500
    }).toString();
    return _0x1a1039 || "(log PM2 kosong)";
  } catch (_0x2649ed) {
    return "Gagal memuat log PM2 (periksa apakah PM2 terpasang dan proses sedang berjalan).";
  }
}
function getWebsiteLogs(_0x2a211b = 150) {
  const _0x3a30d2 = [path.join(LOG_DIR, "panel.log"), path.join(LOG_DIR, "vps.log")];
  let _0x211934 = "";
  for (let _0x19e86e = 0; _0x19e86e < _0x3a30d2.length; _0x19e86e++) {
    const _0x39102f = _0x3a30d2[_0x19e86e];
    if (fs.existsSync(_0x39102f)) {
      try {
        const _0x1815d3 = fs.readFileSync(_0x39102f, "utf8");
        if (_0x1815d3.trim()) {
          const _0x2c9109 = _0x1815d3.split("\n");
          _0x211934 += _0x2c9109.slice(Math.max(0, _0x2c9109.length - _0x2a211b)).join("\n") + "\n";
        }
      } catch (_0x3985d3) {}
    }
  }
  return _0x211934.trim();
}
function restartPanel() {
  if (tunnelProcess) {
    try {
      tunnelProcess.kill("SIGKILL");
    } catch (_0x7b9203) {}
  }
  if (vpsTunnelProcess) {
    try {
      vpsTunnelProcess.kill("SIGKILL");
    } catch (_0x131938) {}
  }
  setTimeout(() => {
    for (const _0x22e559 of activeSockets) {
      try {
        _0x22e559.destroy();
      } catch (_0x244342) {}
    }
    try {
      server.close();
    } catch (_0x1e90b0) {}
    process.exit(0);
  }, 300);
}
const server = http.createServer(async (_0x2246c8, _0x13a8c5) => {
  const _0x4d07fd = new URL(_0x2246c8.url, "http://" + (_0x2246c8.headers.host || "127.0.0.1"));
  const _0x476c2d = _0x4d07fd.pathname;
  const _0xc42d14 = getClientIP(_0x2246c8);
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/auth/status") {
    const _0xd0aad6 = checkAuth(_0x2246c8);
    sendJSON(_0x13a8c5, 200, {
      authenticated: _0xd0aad6,
      username: _0xd0aad6 ? getAuthUser(_0x2246c8) : null,
      serverTime: new Date().toISOString()
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/auth/login") {
    const _0x459cf7 = failedAttempts.get(_0xc42d14) || {
      count: 0,
      lockedUntil: 0
    };
    if (_0x459cf7.lockedUntil > Date.now()) {
      const _0x4e3137 = Math.ceil((_0x459cf7.lockedUntil - Date.now()) / 1000);
      const _0x3d7549 = {
        ok: false,
        message: "Terlalu banyak percobaan. Tunggu " + _0x4e3137 + " detik."
      };
      sendJSON(_0x13a8c5, 429, _0x3d7549);
      return;
    }
    try {
      const _0x50ecc5 = await parseJSONBody(_0x2246c8);
      const _0x105ba8 = (_0x50ecc5.username || "").trim();
      const _0x2d0712 = (_0x50ecc5.password || "").trim();
      if (_0x105ba8 === authConfig.username && _0x2d0712 === authConfig.password) {
        failedAttempts.delete(_0xc42d14);
        const _0x1dde56 = crypto.randomBytes(32).toString("hex");
        createSession(_0x1dde56, _0x105ba8, _0xc42d14);
        _0x13a8c5.setHeader("Set-Cookie", "session_token=" + _0x1dde56 + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000");
        const _0x1f50e0 = {
          ok: true,
          token: _0x1dde56,
          username: _0x105ba8,
          message: "Login berhasil."
        };
        sendJSON(_0x13a8c5, 200, _0x1f50e0);
      } else {
        _0x459cf7.count = (_0x459cf7.count || 0) + 1;
        if (_0x459cf7.count >= 5) {
          _0x459cf7.lockedUntil = Date.now() + 60000;
        }
        failedAttempts.set(_0xc42d14, _0x459cf7);
        sendJSON(_0x13a8c5, 401, {
          ok: false,
          message: "Username atau password salah."
        });
      }
    } catch {
      sendJSON(_0x13a8c5, 400, {
        ok: false,
        message: "Payload tidak valid."
      });
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/auth/logout") {
    const _0x1b86a2 = parseCookies(_0x2246c8);
    if (_0x1b86a2.session_token) {
      deleteSession(_0x1b86a2.session_token);
    }
    const _0x1423ef = _0x2246c8.headers.authorization || "";
    if (_0x1423ef.startsWith("Bearer ")) {
      deleteSession(_0x1423ef.substring(7).trim());
    }
    _0x13a8c5.setHeader("Set-Cookie", "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    sendJSON(_0x13a8c5, 200, {
      ok: true,
      message: "Logout berhasil."
    });
    return;
  }
  function _0x34edc7(_0x159210, _0x376490, _0x5491c9, _0x30f6b1, _0x1250ab, _0x24c702) {
    const _0x100180 = {
      "Content-Type": _0x30f6b1,
      "Cache-Control": _0x24c702 || "no-cache",
      Vary: "Accept-Encoding",
      "X-Content-Type-Options": "nosniff"
    };
    const _0x32662b = _0x100180;
    const _0x77964 = Buffer.isBuffer(_0x1250ab) ? _0x1250ab : Buffer.from(_0x1250ab, "utf8");
    const _0x3eb0f8 = _0x159210.headers["accept-encoding"] || "";
    if (/\bgzip\b/.test(_0x3eb0f8)) {
      _0x32662b["Content-Encoding"] = "gzip";
      zlib.gzip(_0x77964, {
        level: 6
      }, (_0x32881a, _0x23d8b7) => {
        if (_0x32881a) {
          _0x376490.writeHead(_0x5491c9, _0x32662b);
          return _0x376490.end(_0x77964);
        }
        _0x32662b["Content-Length"] = _0x23d8b7.length;
        _0x376490.writeHead(_0x5491c9, _0x32662b);
        _0x376490.end(_0x23d8b7);
      });
    } else if (/\bdeflate\b/.test(_0x3eb0f8)) {
      _0x32662b["Content-Encoding"] = "deflate";
      zlib.deflate(_0x77964, (_0x18b997, _0x9ce44) => {
        if (_0x18b997) {
          _0x376490.writeHead(_0x5491c9, _0x32662b);
          return _0x376490.end(_0x77964);
        }
        _0x32662b["Content-Length"] = _0x9ce44.length;
        _0x376490.writeHead(_0x5491c9, _0x32662b);
        _0x376490.end(_0x9ce44);
      });
    } else {
      _0x32662b["Content-Length"] = _0x77964.length;
      _0x376490.writeHead(_0x5491c9, _0x32662b);
      _0x376490.end(_0x77964);
    }
  }
  if (_0x2246c8.method === "GET" && (_0x476c2d === "/login" || _0x476c2d === "/login.html")) {
    if (checkAuth(_0x2246c8)) {
      _0x13a8c5.writeHead(302, {
        Location: "/"
      });
      _0x13a8c5.end();
      return;
    }
    const _0x1cbd1c = path.join(__dirname, "public", "login.html");
    fs.readFile(_0x1cbd1c, (_0x18ae4f, _0x1d869e) => {
      if (_0x18ae4f) {
        _0x13a8c5.writeHead(500, {
          "Content-Type": "text/plain"
        });
        _0x13a8c5.end("Gagal membaca login.html");
        return;
      }
      _0x34edc7(_0x2246c8, _0x13a8c5, 200, "text/html; charset=utf-8", _0x1d869e, "no-cache, no-store, must-revalidate, max-age=0");
    });
    return;
  }
  if ((_0x2246c8.method === "GET" || _0x2246c8.method === "HEAD") && (_0x476c2d === "/bg-nature.jpg" || _0x476c2d === "/bg.jpg")) {
    const _0x5e3174 = path.join(__dirname, "public", "bg-nature.jpg");
    fs.readFile(_0x5e3174, (_0x2ae311, _0x338a35) => {
      if (_0x2ae311) {
        _0x13a8c5.writeHead(404, {
          "Content-Type": "text/plain"
        });
        _0x13a8c5.end("Not Found");
        return;
      }
      const _0x6fd224 = {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": _0x338a35.length
      };
      _0x13a8c5.writeHead(200, _0x6fd224);
      _0x13a8c5.end(_0x338a35);
    });
    return;
  }
  if (_0x2246c8.method === "GET" && (_0x476c2d === "/" || _0x476c2d === "/index.html")) {
    if (!checkAuth(_0x2246c8)) {
      _0x13a8c5.writeHead(302, {
        Location: "/login"
      });
      _0x13a8c5.end();
      return;
    }
    const _0x570555 = path.join(__dirname, "public", "index.html");
    fs.readFile(_0x570555, (_0x605e0d, _0x481438) => {
      if (_0x605e0d) {
        _0x13a8c5.writeHead(500, {
          "Content-Type": "text/plain"
        });
        _0x13a8c5.end("Gagal membaca index.html");
        return;
      }
      _0x34edc7(_0x2246c8, _0x13a8c5, 200, "text/html; charset=utf-8", _0x481438, "no-cache, no-store, must-revalidate, max-age=0");
    });
    return;
  }
  if (_0x476c2d.startsWith("/api/")) {
    if (!checkAuth(_0x2246c8)) {
      sendJSON(_0x13a8c5, 401, {
        ok: false,
        error: "Unauthorized",
        message: "Sesi login diperlukan."
      });
      return;
    }
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/settings/account") {
    const _0x5c2200 = {
      ok: true,
      username: authConfig.username
    };
    sendJSON(_0x13a8c5, 200, _0x5c2200);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/settings/account") {
    try {
      const _0x5d5fe0 = await parseJSONBody(_0x2246c8);
      const _0x1b0119 = (_0x5d5fe0.currentPassword || "").trim();
      const _0x39feb0 = (_0x5d5fe0.newUsername || "").trim();
      const _0x57de96 = (_0x5d5fe0.newPassword || "").trim();
      if (_0x1b0119 !== authConfig.password) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Password saat ini salah."
        });
        return;
      }
      if (!_0x39feb0 && !_0x57de96) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Tidak ada perubahan yang dimasukkan."
        });
        return;
      }
      if (_0x39feb0 && _0x39feb0.length < 3) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Username baru minimal 3 karakter."
        });
        return;
      }
      if (_0x57de96 && _0x57de96.length < 5) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Password baru minimal 5 karakter."
        });
        return;
      }
      saveAuthConfig(_0x39feb0 || authConfig.username, _0x57de96 || authConfig.password);
      const _0x4075e6 = {
        ok: true,
        username: authConfig.username,
        message: "Username & Password admin berhasil diperbarui!"
      };
      sendJSON(_0x13a8c5, 200, _0x4075e6);
    } catch (_0x2a77b7) {
      const _0x2b0c36 = {
        ok: false,
        message: "Gagal memperbarui pengaturan akun: " + _0x2a77b7.message
      };
      sendJSON(_0x13a8c5, 400, _0x2b0c36);
    }
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/system/stats") {
    sendJSON(_0x13a8c5, 200, getSystemStats());
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/logs/website") {
    sendJSON(_0x13a8c5, 200, {
      ok: true,
      logs: getWebsiteLogs()
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/logs/clear") {
    try {
      if (fs.existsSync(LOG_DIR)) {
        const _0x58b029 = fs.readdirSync(LOG_DIR);
        for (let _0x5a0f4c = 0; _0x5a0f4c < _0x58b029.length; _0x5a0f4c++) {
          if (_0x58b029[_0x5a0f4c].endsWith(".log")) {
            fs.writeFileSync(path.join(LOG_DIR, _0x58b029[_0x5a0f4c]), "[" + formatLogTimestamp() + "] [SYSTEM] Log dibersihkan oleh pengguna.\n");
          }
        }
      }
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "Semua berkas log server berhasil dibersihkan."
      });
    } catch (_0x53df87) {
      const _0x2634e6 = {
        ok: false,
        message: "Gagal membersihkan log: " + _0x53df87.message
      };
      sendJSON(_0x13a8c5, 500, _0x2634e6);
    }
    return;
  }
  if (_0x2246c8.method === "GET" && (_0x476c2d === "/api/logs/stream" || _0x476c2d === "/api/logs/tail")) {
    _0x13a8c5.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff"
    });
    const _0xa0af0c = getWebsiteLogs(120);
    const _0x1f54d5 = {
      type: "init",
      logs: _0xa0af0c
    };
    _0x13a8c5.write("data: " + JSON.stringify(_0x1f54d5) + "\n\n");
    const _0xefec1e = path.join(LOG_DIR, "panel.log");
    let _0x2f370b = fs.existsSync(_0xefec1e) ? fs.statSync(_0xefec1e).size : 0;
    const _0xe1f8dc = setInterval(() => {
      if (_0x13a8c5.destroyed || _0x13a8c5.writableEnded) {
        clearInterval(_0xe1f8dc);
        return;
      }
      try {
        if (!fs.existsSync(_0xefec1e)) {
          return;
        }
        const _0x1f208b = fs.statSync(_0xefec1e).size;
        if (_0x1f208b > _0x2f370b) {
          const _0x1a35c1 = {
            start: _0x2f370b,
            end: _0x1f208b
          };
          const _0x49eb8d = fs.createReadStream(_0xefec1e, _0x1a35c1);
          let _0x3dfa05 = "";
          _0x49eb8d.on("data", _0x1fc7c8 => {
            _0x3dfa05 += _0x1fc7c8.toString("utf8");
          });
          _0x49eb8d.on("end", () => {
            if (_0x3dfa05 && !_0x13a8c5.destroyed && !_0x13a8c5.writableEnded) {
              const _0xa33710 = {
                type: "append",
                logs: _0x3dfa05
              };
              _0x13a8c5.write("data: " + JSON.stringify(_0xa33710) + "\n\n");
            }
          });
          _0x2f370b = _0x1f208b;
        } else if (_0x1f208b < _0x2f370b) {
          _0x2f370b = _0x1f208b;
        }
      } catch (_0x1f55eb) {}
    }, 1500);
    _0x2246c8.on("close", () => {
      clearInterval(_0xe1f8dc);
    });
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/pm2/status") {
    sendJSON(_0x13a8c5, 200, getPm2Status());
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/pm2/logs") {
    const _0x4f95c4 = _0x4d07fd.searchParams.get("name") || "";
    sendJSON(_0x13a8c5, 200, {
      ok: true,
      logs: getPm2Logs(_0x4f95c4)
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/pm2/action") {
    try {
      const _0x167e47 = await parseJSONBody(_0x2246c8);
      const _0x3e026b = (_0x167e47.action || "").trim().toLowerCase();
      const _0x1f2789 = (_0x167e47.name || "all").replace(/[^a-zA-Z0-9_.-]/g, "");
      if (["restart", "stop", "start", "delete"].indexOf(_0x3e026b) === -1) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Aksi PM2 tidak valid. Pilih: restart, stop, start, atau delete."
        });
        return;
      }
      exec("pm2 " + _0x3e026b + " \"" + _0x1f2789 + "\" 2>&1", {
        timeout: 8000
      }, (_0x5d8bf4, _0x59da00) => {
        if (_0x5d8bf4) {
          const _0x4c90bd = _0x59da00 ? _0x59da00.trim() : _0x5d8bf4.message;
          const _0x328d99 = {
            ok: false,
            message: "Gagal memproses PM2 " + _0x3e026b + ": " + _0x4c90bd
          };
          sendJSON(_0x13a8c5, 200, _0x328d99);
        } else {
          const _0x445c3c = {
            ok: true,
            message: "Berhasil menjalankan pm2 " + _0x3e026b + " " + _0x1f2789,
            output: _0x59da00
          };
          sendJSON(_0x13a8c5, 200, _0x445c3c);
        }
      });
    } catch (_0x356c53) {
      const _0x286402 = {
        ok: false,
        message: "Payload tidak valid: " + _0x356c53.message
      };
      sendJSON(_0x13a8c5, 200, _0x286402);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/restart-panel") {
    sendJSON(_0x13a8c5, 200, {
      ok: true,
      message: "Server panel sedang dimulai ulang..."
    });
    restartPanel();
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/vps/status") {
    const _0x2305f7 = {
      ok: true,
      running: lastVpsRunningState,
      vps: vpsConfig
    };
    sendJSON(_0x13a8c5, 200, _0x2305f7);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/vps/start") {
    sendJSON(_0x13a8c5, 200, startVpsService());
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/vps/stop") {
    sendJSON(_0x13a8c5, 200, stopVpsService());
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/vps/restart") {
    const _0x54eabb = await restartVpsService();
    sendJSON(_0x13a8c5, 200, _0x54eabb);
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/apps/9router/status") {
    const _0x43372a = isRouterInstalled();
    const _0x1c07c7 = await checkRouterListeningAsync();
    const _0x16e174 = _0x43372a ? getRouterVersion() : null;
    let _0x152e26 = null;
    if (fs.existsSync(ROUTER_PID_FILE)) {
      try {
        _0x152e26 = parseInt(fs.readFileSync(ROUTER_PID_FILE, "utf8").trim(), 10);
      } catch (_0xfebf72) {}
    }
    const _0x1b3934 = getLocalIPs();
    const _0xf1bf68 = _0x1b3934.length > 0 ? _0x1b3934[0].address : "127.0.0.1";
    const _0xe50bea = {
      active: routerInstallTracker.active,
      progress: routerInstallTracker.progress,
      step: routerInstallTracker.step,
      success: routerInstallTracker.success,
      error: routerInstallTracker.error,
      logs: routerInstallTracker.logs
    };
    const _0x499004 = {
      ok: true,
      installed: _0x43372a,
      running: _0x1c07c7,
      version: _0x16e174,
      port: ROUTER_PORT,
      pid: _0x152e26,
      localIp: _0xf1bf68,
      localUrl: "http://" + _0xf1bf68 + ":" + ROUTER_PORT,
      installTracker: _0xe50bea
    };
    sendJSON(_0x13a8c5, 200, _0x499004);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/apps/9router/install") {
    const _0x56021f = await start9RouterInstallJob();
    sendJSON(_0x13a8c5, 200, _0x56021f);
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/apps/9router/install-progress") {
    const _0x2d8f0c = {
      ok: true,
      data: routerInstallTracker
    };
    sendJSON(_0x13a8c5, 200, _0x2d8f0c);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/apps/9router/start") {
    const _0x3bbb0e = await start9RouterService();
    sendJSON(_0x13a8c5, 200, _0x3bbb0e);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/apps/9router/stop") {
    const _0x15afb1 = await stop9RouterService();
    sendJSON(_0x13a8c5, 200, _0x15afb1);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/apps/9router/restart") {
    const _0x5eea1c = await restart9RouterService();
    sendJSON(_0x13a8c5, 200, _0x5eea1c);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/apps/9router/delete") {
    const _0x311751 = await delete9RouterService();
    sendJSON(_0x13a8c5, 200, _0x311751);
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/tunnel/reconnect") {
    if (tunnelProcess) {
      try {
        tunnelProcess.kill("SIGKILL");
      } catch (_0x52ad66) {}
      tunnelProcess = null;
    }
    currentPublicUrl = null;
    clearTimeout(tunnelRetryTimer);
    setTimeout(startPublicTunnel, 500);
    sendJSON(_0x13a8c5, 200, {
      ok: true,
      message: "Cloudflare Tunnel sedang dihubungkan ulang..."
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/screen-off") {
    sendJSON(_0x13a8c5, 200, controlScreen("off"));
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/screen-on") {
    sendJSON(_0x13a8c5, 200, controlScreen("on"));
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/torch") {
    let _0x7bb5d8 = {};
    try {
      _0x7bb5d8 = await parseJSONBody(_0x2246c8);
    } catch (_0x1c4013) {}
    sendJSON(_0x13a8c5, 200, controlTorch(_0x7bb5d8.state));
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/vibrate") {
    let _0x7d57 = {};
    try {
      _0x7d57 = await parseJSONBody(_0x2246c8);
    } catch (_0x32d56b) {}
    sendJSON(_0x13a8c5, 200, triggerVibrate(_0x7d57.duration || 400));
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/wakelock") {
    let _0x3379c5 = {};
    try {
      _0x3379c5 = await parseJSONBody(_0x2246c8);
    } catch (_0x550511) {}
    sendJSON(_0x13a8c5, 200, toggleWakeLock(_0x3379c5.enable));
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/device/reboot") {
    sendJSON(_0x13a8c5, 200, rebootDevice());
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/files/list") {
    const _0x2e184b = _0x4d07fd.searchParams.get("path") || DEFAULT_ROOT_DIR;
    try {
      const _0x22abf9 = listDirectory(_0x2e184b);
      const _0x391d67 = {
        ok: true,
        data: _0x22abf9
      };
      sendJSON(_0x13a8c5, 200, _0x391d67);
    } catch (_0x30ca28) {
      try {
        const _0x37db0e = listDirectory(DEFAULT_ROOT_DIR);
        const _0x4960e9 = {
          ok: true,
          data: _0x37db0e,
          warning: _0x30ca28.message
        };
        sendJSON(_0x13a8c5, 200, _0x4960e9);
      } catch (_0x4754e3) {
        const _0x180fe1 = {
          ok: false,
          message: _0x30ca28.message
        };
        sendJSON(_0x13a8c5, 200, _0x180fe1);
      }
    }
    return;
  }
  if (_0x2246c8.method === "GET" && _0x476c2d === "/api/files/download") {
    const _0x8d2f8 = _0x4d07fd.searchParams.get("path");
    if (!_0x8d2f8 || !fs.existsSync(_0x8d2f8)) {
      _0x13a8c5.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      _0x13a8c5.end("File tidak ditemukan");
      return;
    }
    try {
      const _0x34b21c = fs.statSync(_0x8d2f8);
      if (_0x34b21c.isDirectory()) {
        const _0x3425d1 = path.basename(_0x8d2f8);
        const _0x34dac8 = path.dirname(_0x8d2f8);
        _0x13a8c5.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": "attachment; filename=\"" + encodeURIComponent(_0x3425d1) + ".zip\""
        });
        const _0x25a2ec = {
          cwd: _0x34dac8
        };
        const _0x20643d = spawn("zip", ["-r", "-", _0x3425d1], _0x25a2ec);
        _0x20643d.stdout.pipe(_0x13a8c5);
        _0x2246c8.on("close", () => {
          try {
            _0x20643d.kill();
          } catch (_0x51359f) {}
        });
        return;
      }
      const _0x11a555 = path.basename(_0x8d2f8);
      _0x13a8c5.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": _0x34b21c.size,
        "Content-Disposition": "attachment; filename=\"" + encodeURIComponent(_0x11a555) + "\""
      });
      fs.createReadStream(_0x8d2f8).pipe(_0x13a8c5);
    } catch (_0x1eba3c) {
      if (!_0x13a8c5.headersSent) {
        const _0x51ec40 = {
          ok: false,
          message: "Gagal mengunduh file: " + _0x1eba3c.message
        };
        sendJSON(_0x13a8c5, 200, _0x51ec40);
      } else {
        _0x13a8c5.end();
      }
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/upload") {
    const _0x3b1cae = _0x4d07fd.searchParams.get("dir");
    const _0x114f08 = resolveSafePath(_0x3b1cae);
    if (!fs.existsSync(_0x114f08)) {
      sendJSON(_0x13a8c5, 200, {
        ok: false,
        message: "Direktori tujuan tidak ditemukan di server."
      });
      return;
    }
    handleStreamingUpload(_0x2246c8, _0x114f08, (_0x2e3986, _0x3370ae) => {
      if (_0x2e3986) {
        const _0x1baf06 = {
          ok: false,
          message: "Upload gagal: " + _0x2e3986.message
        };
        sendJSON(_0x13a8c5, 200, _0x1baf06);
      } else {
        const _0x2ce1a1 = {
          ok: true,
          message: "Berhasil mengupload " + _0x3370ae.length + " file & folder.",
          files: _0x3370ae
        };
        sendJSON(_0x13a8c5, 200, _0x2ce1a1);
      }
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/unzip") {
    const _0x15ee94 = _0x4d07fd.searchParams.get("path");
    if (!_0x15ee94) {
      sendJSON(_0x13a8c5, 200, {
        ok: false,
        message: "Parameter path ZIP tidak diberikan."
      });
      return;
    }
    const _0x2fd098 = resolveSafePath(_0x15ee94);
    if (!fs.existsSync(_0x2fd098)) {
      sendJSON(_0x13a8c5, 200, {
        ok: false,
        message: "File ZIP tidak ditemukan."
      });
      return;
    }
    const _0x1a2743 = path.dirname(_0x2fd098);
    const _0x13517a = os.platform() === "win32";
    const _0x4e130a = _0x13517a ? "tar -xf \"" + _0x2fd098 + "\" -C \"" + _0x1a2743 + "\"" : "unzip -o \"" + _0x2fd098 + "\" -d \"" + _0x1a2743 + "\"";
    exec(_0x4e130a, {
      timeout: 60000
    }, (_0x4dfccc, _0x479594, _0x579c53) => {
      if (_0x4dfccc) {
        const _0x5f4558 = {
          ok: false,
          message: "Ekstrak gagal: " + (_0x579c53 || _0x4dfccc.message)
        };
        sendJSON(_0x13a8c5, 200, _0x5f4558);
      } else {
        sendJSON(_0x13a8c5, 200, {
          ok: true,
          message: "File ZIP berhasil diekstrak!"
        });
      }
    });
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/mkdir") {
    try {
      const _0x2f2007 = await parseJSONBody(_0x2246c8);
      const _0x4a0129 = (_0x2f2007.name || "").trim();
      if (!_0x4a0129) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Nama folder tidak boleh kosong."
        });
        return;
      }
      const _0x269132 = path.basename(_0x4a0129);
      const _0x119601 = path.join(resolveSafePath(_0x2f2007.parentPath), _0x269132);
      if (fs.existsSync(_0x119601)) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Folder dengan nama tersebut sudah ada."
        });
        return;
      }
      fs.mkdirSync(_0x119601, {
        recursive: true
      });
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "Folder berhasil dibuat."
      });
    } catch (_0x3da9d5) {
      const _0x48db61 = {
        ok: false,
        message: "Gagal membuat folder: " + _0x3da9d5.message
      };
      sendJSON(_0x13a8c5, 200, _0x48db61);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/create") {
    try {
      const _0x299e8a = await parseJSONBody(_0x2246c8);
      const _0x13cc95 = (_0x299e8a.name || "").trim();
      if (!_0x13cc95) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Nama file tidak boleh kosong."
        });
        return;
      }
      const _0x1a1dcc = path.basename(_0x13cc95);
      const _0x3ddd9a = path.join(resolveSafePath(_0x299e8a.parentPath), _0x1a1dcc);
      if (fs.existsSync(_0x3ddd9a)) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "File dengan nama tersebut sudah ada."
        });
        return;
      }
      fs.writeFileSync(_0x3ddd9a, "", "utf8");
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "File berhasil dibuat."
      });
    } catch (_0x25b34a) {
      const _0x3131fb = {
        ok: false,
        message: "Gagal membuat file: " + _0x25b34a.message
      };
      sendJSON(_0x13a8c5, 200, _0x3131fb);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/delete") {
    try {
      const _0x7f792e = await parseJSONBody(_0x2246c8);
      if (!_0x7f792e.path) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Path berkas tidak ditentukan."
        });
        return;
      }
      const _0x366ce3 = resolveSafePath(_0x7f792e.path);
      if (fs.existsSync(_0x366ce3)) {
        const _0x5ad641 = fs.statSync(_0x366ce3);
        if (_0x5ad641.isDirectory()) {
          fs.rmSync(_0x366ce3, {
            recursive: true,
            force: true
          });
        } else {
          fs.unlinkSync(_0x366ce3);
        }
        sendJSON(_0x13a8c5, 200, {
          ok: true,
          message: "Berhasil dihapus."
        });
      } else {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Berkas atau folder tidak ditemukan."
        });
      }
    } catch (_0x28b8b2) {
      const _0x3adb0d = {
        ok: false,
        message: "Gagal menghapus: " + _0x28b8b2.message
      };
      sendJSON(_0x13a8c5, 200, _0x3adb0d);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/rename") {
    try {
      const _0x2ebbf3 = await parseJSONBody(_0x2246c8);
      if (!_0x2ebbf3.oldPath) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Path asal tidak ditentukan."
        });
        return;
      }
      const _0x54e7c0 = resolveSafePath(_0x2ebbf3.oldPath);
      const _0x197a9e = path.basename((_0x2ebbf3.newName || "").trim());
      if (!_0x197a9e) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Nama baru tidak boleh kosong."
        });
        return;
      }
      if (!fs.existsSync(_0x54e7c0)) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "File atau folder asal tidak ditemukan."
        });
        return;
      }
      const _0x37c349 = path.join(path.dirname(_0x54e7c0), _0x197a9e);
      if (fs.existsSync(_0x37c349)) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "File atau folder dengan nama baru sudah ada."
        });
        return;
      }
      fs.renameSync(_0x54e7c0, _0x37c349);
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "Nama berhasil diubah."
      });
    } catch (_0x584018) {
      const _0x25ae9f = {
        ok: false,
        message: "Gagal mengubah nama: " + _0x584018.message
      };
      sendJSON(_0x13a8c5, 200, _0x25ae9f);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/content") {
    try {
      const _0x2d6afa = await parseJSONBody(_0x2246c8);
      if (!_0x2d6afa.path) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Path berkas tidak ditentukan."
        });
        return;
      }
      const _0x1df821 = resolveSafePath(_0x2d6afa.path);
      if (!fs.existsSync(_0x1df821)) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "File tidak ditemukan."
        });
        return;
      }
      const _0x2ef2d2 = fs.statSync(_0x1df821);
      if (_0x2ef2d2.isDirectory()) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Target adalah direktori, bukan file teks."
        });
        return;
      }
      if (_0x2ef2d2.size > 2097152) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "File terlalu besar untuk diedit langsung di web (> 2MB)."
        });
        return;
      }
      const _0x395ff2 = fs.readFileSync(_0x1df821, "utf8");
      const _0x1cf7fd = {
        ok: true,
        content: _0x395ff2
      };
      sendJSON(_0x13a8c5, 200, _0x1cf7fd);
    } catch (_0xced197) {
      const _0xfe5152 = {
        ok: false,
        message: "Gagal membaca isi file: " + _0xced197.message
      };
      sendJSON(_0x13a8c5, 200, _0xfe5152);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/files/save") {
    try {
      const _0x9aa367 = await parseJSONBody(_0x2246c8);
      if (!_0x9aa367.path) {
        sendJSON(_0x13a8c5, 200, {
          ok: false,
          message: "Path berkas tidak ditentukan."
        });
        return;
      }
      const _0x547536 = resolveSafePath(_0x9aa367.path);
      fs.writeFileSync(_0x547536, _0x9aa367.content || "", "utf8");
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "File berhasil disimpan."
      });
    } catch (_0x13c49b) {
      const _0x3a9b28 = {
        ok: false,
        message: "Gagal menyimpan file: " + _0x13c49b.message
      };
      sendJSON(_0x13a8c5, 200, _0x3a9b28);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/terminal/stream") {
    try {
      const _0x29d9d9 = await parseJSONBody(_0x2246c8);
      const _0x1f0f3d = (_0x29d9d9.command || "").trim();
      const _0x57cb76 = os.platform() === "win32" ? BASE_DIR : process.env.HOME || "/data/data/com.termux/files/home";
      const _0x510b28 = _0x29d9d9.id || "job_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      let _0x367212 = _0x57cb76;
      if (_0x29d9d9.cwd) {
        let _0x2f1643 = _0x29d9d9.cwd;
        if (_0x2f1643 === "~" || _0x2f1643.startsWith("~/")) {
          _0x2f1643 = path.join(_0x57cb76, _0x2f1643 === "~" ? "" : _0x2f1643.substring(2));
        }
        if (fs.existsSync(_0x2f1643)) {
          _0x367212 = _0x2f1643;
        }
      }
      if (!_0x1f0f3d) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Perintah tidak boleh kosong."
        });
        return;
      }
      const _0x3c0bba = os.platform() === "win32";
      const _0x2c7326 = "/data/data/com.termux/files/usr/bin/bash";
      const _0x551c96 = _0x3c0bba ? "cmd.exe" : fs.existsSync(_0x2c7326) ? _0x2c7326 : process.env.SHELL || "bash";
      const _0x51ad13 = "___TERM_PWD___";
      const _0x1f0030 = _0x3c0bba ? _0x1f0f3d + " & echo " + _0x51ad13 + "%CD%" : _0x1f0f3d + "\necho \"" + _0x51ad13 + "$PWD\"";
      const _0x3ea33e = _0x3c0bba ? ["/c", _0x1f0030] : ["-c", _0x1f0030];
      _0x13a8c5.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      });
      const _0x3308f2 = Object.assign({}, process.env, {
        PYTHONUNBUFFERED: "1",
        FORCE_COLOR: "1",
        TERM: "xterm-256color",
        DEBIAN_FRONTEND: "noninteractive",
        APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE: "1"
      });
      const _0xd3c823 = {
        cwd: _0x367212,
        env: _0x3308f2,
        detached: !_0x3c0bba
      };
      const _0x22dc36 = spawn(_0x551c96, _0x3ea33e, _0xd3c823);
      const _0x22e26b = {
        child: _0x22dc36,
        pid: _0x22dc36.pid
      };
      activeTerminalJobs.set(_0x510b28, _0x22e26b);
      const _0x14e12a = _0x4eea3b => {
        try {
          if (!_0x13a8c5.destroyed && !_0x13a8c5.writableEnded) {
            _0x13a8c5.write(_0x4eea3b);
          }
        } catch (_0x323859) {}
      };
      _0x2246c8.on("close", () => {
        activeTerminalJobs.delete(_0x510b28);
        try {
          if (_0x22dc36 && !_0x22dc36.killed) {
            if (!_0x3c0bba) {
              process.kill(-_0x22dc36.pid, "SIGTERM");
            } else {
              _0x22dc36.kill("SIGTERM");
            }
          }
        } catch (_0x1a322f) {}
      });
      const _0x49dda2 = {
        type: "init",
        jobId: _0x510b28,
        pid: _0x22dc36.pid
      };
      _0x14e12a(JSON.stringify(_0x49dda2) + "\n");
      let _0x2e45f9 = "";
      const _0xd796e5 = _0x16b68c => {
        if (!_0x16b68c) {
          return "";
        }
        return _0x16b68c.replace(/WARNING:\s*apt\s+does\s+not\s+have\s+a\s+stable\s+cli\s+interface[^\r\n]*\r?\n?/gi, "");
      };
      const _0x3426b9 = (_0x163bd4, _0x121613) => {
        let _0x45665e = _0x163bd4.toString();
        _0x45665e = _0xd796e5(_0x45665e);
        if (!_0x45665e) {
          return;
        }
        if (_0x45665e.includes(_0x51ad13)) {
          const _0x38bf90 = _0x45665e.split(_0x51ad13);
          if (_0x38bf90[0]) {
            const _0x3d1430 = {
              type: _0x121613,
              data: _0x38bf90[0]
            };
            _0x14e12a(JSON.stringify(_0x3d1430) + "\n");
          }
          _0x2e45f9 += _0x38bf90.slice(1).join(_0x51ad13);
        } else if (_0x2e45f9) {
          _0x2e45f9 += _0x45665e;
        } else {
          const _0x369831 = {
            type: _0x121613,
            data: _0x45665e
          };
          _0x14e12a(JSON.stringify(_0x369831) + "\n");
        }
      };
      _0x22dc36.stdout.on("data", _0x413af7 => _0x3426b9(_0x413af7, "out"));
      _0x22dc36.stderr.on("data", _0x53662e => _0x3426b9(_0x53662e, "err"));
      _0x22dc36.on("close", _0x4b407a => {
        activeTerminalJobs.delete(_0x510b28);
        let _0xaeafa7 = _0x367212;
        const _0x1216a0 = _0x2e45f9.trim().split("\n")[0];
        if (_0x1216a0 && fs.existsSync(_0x1216a0)) {
          _0xaeafa7 = _0x1216a0;
        }
        const _0x4f71df = {
          type: "end",
          exitCode: _0x4b407a,
          cwd: _0xaeafa7
        };
        _0x14e12a(JSON.stringify(_0x4f71df) + "\n");
        try {
          if (!_0x13a8c5.writableEnded) {
            _0x13a8c5.end();
          }
        } catch (_0x134e41) {}
      });
      _0x22dc36.on("error", _0x45a809 => {
        activeTerminalJobs.delete(_0x510b28);
        const _0x123055 = {
          type: "err",
          data: "\n[Error: " + _0x45a809.message + "]\n"
        };
        _0x14e12a(JSON.stringify(_0x123055) + "\n");
        const _0x217a39 = {
          type: "end",
          exitCode: 1,
          cwd: _0x367212
        };
        _0x14e12a(JSON.stringify(_0x217a39) + "\n");
        try {
          if (!_0x13a8c5.writableEnded) {
            _0x13a8c5.end();
          }
        } catch (_0x593f19) {}
      });
    } catch (_0x1b964c) {
      if (!_0x13a8c5.headersSent) {
        const _0x4a30f8 = {
          ok: false,
          message: _0x1b964c.message
        };
        sendJSON(_0x13a8c5, 500, _0x4a30f8);
      } else {
        try {
          if (!_0x13a8c5.writableEnded) {
            _0x13a8c5.end();
          }
        } catch (_0x3e201c) {}
      }
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/terminal/input") {
    try {
      const _0x3d4bbc = await parseJSONBody(_0x2246c8);
      const _0x4b386b = _0x3d4bbc.id;
      const _0x3247a7 = _0x3d4bbc.input !== undefined ? String(_0x3d4bbc.input) : "";
      if (!_0x4b386b || !activeTerminalJobs.has(_0x4b386b)) {
        sendJSON(_0x13a8c5, 404, {
          ok: false,
          message: "Tidak ada proses terminal aktif dengan ID tersebut."
        });
        return;
      }
      const _0x41bdcf = activeTerminalJobs.get(_0x4b386b);
      if (_0x41bdcf && _0x41bdcf.child && _0x41bdcf.child.stdin && !_0x41bdcf.child.stdin.destroyed) {
        _0x41bdcf.child.stdin.write(_0x3247a7 + "\n");
        sendJSON(_0x13a8c5, 200, {
          ok: true,
          message: "Input berhasil dikirim ke proses."
        });
      } else {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Stdin proses tidak aktif."
        });
      }
    } catch (_0x134563) {
      const _0x3e5044 = {
        ok: false,
        message: _0x134563.message
      };
      sendJSON(_0x13a8c5, 500, _0x3e5044);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/terminal/kill") {
    try {
      const _0x458efd = await parseJSONBody(_0x2246c8);
      const _0x4d447a = _0x458efd.id;
      if (!_0x4d447a || !activeTerminalJobs.has(_0x4d447a)) {
        sendJSON(_0x13a8c5, 200, {
          ok: true,
          message: "Tidak ada proses aktif dengan ID tersebut."
        });
        return;
      }
      const _0x29ed6b = activeTerminalJobs.get(_0x4d447a);
      activeTerminalJobs.delete(_0x4d447a);
      if (_0x29ed6b && _0x29ed6b.child) {
        try {
          if (os.platform() !== "win32") {
            process.kill(-_0x29ed6b.child.pid, "SIGINT");
          } else {
            _0x29ed6b.child.kill("SIGINT");
          }
        } catch (_0xabf903) {
          try {
            _0x29ed6b.child.kill("SIGKILL");
          } catch (_0x5c7701) {}
        }
      }
      sendJSON(_0x13a8c5, 200, {
        ok: true,
        message: "Proses terminal berhasil dihentikan (Ctrl + C)."
      });
    } catch (_0x1e9179) {
      const _0x6ed42b = {
        ok: false,
        message: _0x1e9179.message
      };
      sendJSON(_0x13a8c5, 500, _0x6ed42b);
    }
    return;
  }
  if (_0x2246c8.method === "POST" && _0x476c2d === "/api/terminal/exec") {
    try {
      const _0x1966b5 = await parseJSONBody(_0x2246c8);
      const _0x526984 = (_0x1966b5.command || "").trim();
      const _0x179c0c = process.env.HOME || (os.platform() === "win32" ? os.homedir() : "/data/data/com.termux/files/home");
      let _0x19c6e5 = _0x179c0c;
      if (_0x1966b5.cwd) {
        let _0xa1314c = _0x1966b5.cwd;
        if (_0xa1314c === "~" || _0xa1314c.startsWith("~/")) {
          _0xa1314c = path.join(_0x179c0c, _0xa1314c === "~" ? "" : _0xa1314c.substring(2));
        }
        if (fs.existsSync(_0xa1314c)) {
          _0x19c6e5 = _0xa1314c;
        }
      }
      if (!_0x526984) {
        sendJSON(_0x13a8c5, 400, {
          ok: false,
          message: "Perintah tidak boleh kosong."
        });
        return;
      }
      const _0x338624 = os.platform() === "win32";
      const _0x5f2420 = _0x338624 ? "cmd.exe" : "bash";
      const _0x559baf = "___TERM_PWD___";
      const _0x3f95a2 = _0x338624 ? "cd /d \"" + _0x19c6e5 + "\" & " + _0x526984 + " & echo " + _0x559baf + "%CD%" : "cd \"" + _0x19c6e5 + "\"\n" + _0x526984 + "\necho \"" + _0x559baf + "$PWD\"";
      const _0x3e9f03 = _0x338624 ? ["/c", _0x3f95a2] : ["-c", _0x3f95a2];
      const _0x223fc0 = {
        cwd: _0x19c6e5,
        env: process.env,
        timeout: 600000
      };
      const _0x3ed6a9 = spawn(_0x5f2420, _0x3e9f03, _0x223fc0);
      let _0x45a752 = "";
      let _0x46e77c = "";
      _0x3ed6a9.stdout.on("data", _0x7dd536 => _0x45a752 += _0x7dd536.toString());
      _0x3ed6a9.stderr.on("data", _0x10440a => _0x46e77c += _0x10440a.toString());
      _0x3ed6a9.on("close", _0x505c4a => {
        let _0x5b62a7 = _0x19c6e5;
        const _0x391cbc = _0x45a752.lastIndexOf(_0x559baf);
        if (_0x391cbc !== -1) {
          const _0x52b797 = _0x45a752.substring(_0x391cbc + _0x559baf.length).trim();
          _0x45a752 = _0x45a752.substring(0, _0x391cbc);
          if (_0x52b797 && fs.existsSync(_0x52b797)) {
            _0x5b62a7 = _0x52b797;
          }
        }
        const _0x370acd = {
          ok: true,
          exitCode: _0x505c4a,
          stdout: _0x45a752,
          stderr: _0x46e77c,
          cwd: _0x5b62a7
        };
        sendJSON(_0x13a8c5, 200, _0x370acd);
      });
      _0x3ed6a9.on("error", _0x46e395 => {
        const _0x2a4101 = {
          ok: false,
          message: _0x46e395.message
        };
        sendJSON(_0x13a8c5, 500, _0x2a4101);
      });
    } catch (_0x5b8a84) {
      const _0x5948c8 = {
        ok: false,
        message: _0x5b8a84.message
      };
      sendJSON(_0x13a8c5, 500, _0x5948c8);
    }
    return;
  }
  _0x13a8c5.writeHead(404, {
    "Content-Type": "text/plain"
  });
  _0x13a8c5.end("404 Not Found");
});
function encodeWsFrame(_0x1846ba) {
  const _0x459c22 = Buffer.from(typeof _0x1846ba === "string" ? _0x1846ba : JSON.stringify(_0x1846ba), "utf8");
  const _0x4b92c9 = _0x459c22.length;
  let _0xab7a6d;
  if (_0x4b92c9 < 126) {
    _0xab7a6d = Buffer.alloc(2);
    _0xab7a6d[0] = 129;
    _0xab7a6d[1] = _0x4b92c9;
  } else if (_0x4b92c9 <= 65535) {
    _0xab7a6d = Buffer.alloc(4);
    _0xab7a6d[0] = 129;
    _0xab7a6d[1] = 126;
    _0xab7a6d.writeUInt16BE(_0x4b92c9, 2);
  } else {
    _0xab7a6d = Buffer.alloc(10);
    _0xab7a6d[0] = 129;
    _0xab7a6d[1] = 127;
    _0xab7a6d.writeBigUInt64BE(BigInt(_0x4b92c9), 2);
  }
  return Buffer.concat([_0xab7a6d, _0x459c22]);
}
function decodeWsFrames(_0xa94eaa) {
  const _0x4e78c5 = [];
  let _0x25ab21 = 0;
  while (_0x25ab21 < _0xa94eaa.length) {
    if (_0xa94eaa.length - _0x25ab21 < 2) {
      break;
    }
    const _0xa0a3fc = _0xa94eaa[_0x25ab21];
    const _0x28091d = _0xa94eaa[_0x25ab21 + 1];
    const _0x4d6a65 = _0xa0a3fc & 15;
    const _0x141713 = (_0x28091d & 128) !== 0;
    let _0x2de394 = _0x28091d & 127;
    let _0x32088f = 2;
    if (_0x2de394 === 126) {
      if (_0xa94eaa.length - _0x25ab21 < 4) {
        break;
      }
      _0x2de394 = _0xa94eaa.readUInt16BE(_0x25ab21 + 2);
      _0x32088f = 4;
    } else if (_0x2de394 === 127) {
      if (_0xa94eaa.length - _0x25ab21 < 10) {
        break;
      }
      _0x2de394 = Number(_0xa94eaa.readBigUInt64BE(_0x25ab21 + 2));
      _0x32088f = 10;
    }
    const _0x57ed88 = _0x141713 ? 4 : 0;
    if (_0xa94eaa.length - _0x25ab21 < _0x32088f + _0x57ed88 + _0x2de394) {
      break;
    }
    let _0x207c56 = null;
    if (_0x141713) {
      _0x207c56 = _0xa94eaa.slice(_0x25ab21 + _0x32088f, _0x25ab21 + _0x32088f + 4);
    }
    const _0x325d0a = _0x25ab21 + _0x32088f + _0x57ed88;
    const _0x44cc0d = Buffer.alloc(_0x2de394);
    for (let _0x441e69 = 0; _0x441e69 < _0x2de394; _0x441e69++) {
      _0x44cc0d[_0x441e69] = _0x141713 ? _0xa94eaa[_0x325d0a + _0x441e69] ^ _0x207c56[_0x441e69 % 4] : _0xa94eaa[_0x325d0a + _0x441e69];
    }
    const _0x18ea28 = {
      opcode: _0x4d6a65,
      payload: _0x44cc0d
    };
    _0x4e78c5.push(_0x18ea28);
    _0x25ab21 = _0x325d0a + _0x2de394;
  }
  return {
    frames: _0x4e78c5,
    rest: _0xa94eaa.slice(_0x25ab21)
  };
}
server.on("upgrade", (_0x4686b4, _0x1d845c, _0x2e0ec9) => {
  try {
    const _0x3e3c6b = new URL(_0x4686b4.url, "http://" + (_0x4686b4.headers.host || "127.0.0.1"));
    const _0x105add = _0x3e3c6b.pathname;
    let _0x1081db = checkAuth(_0x4686b4);
    const _0x3bc340 = _0x3e3c6b.searchParams.get("token");
    if (!_0x1081db && _0x3bc340 && isSessionValid(_0x3bc340)) {
      _0x1081db = true;
    }
    if (!_0x1081db) {
      _0x1d845c.write("HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nUnauthorized WebSocket");
      _0x1d845c.destroy();
      return;
    }
    const _0x12e787 = _0x4686b4.headers["sec-websocket-key"];
    if (!_0x12e787) {
      _0x1d845c.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
      _0x1d845c.destroy();
      return;
    }
    const _0x1de91 = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    const _0x2ceafd = crypto.createHash("sha1").update(_0x12e787 + _0x1de91).digest("base64");
    const _0xec86a2 = ["HTTP/1.1 101 Switching Protocols", "Upgrade: websocket", "Connection: Upgrade", "Sec-WebSocket-Accept: " + _0x2ceafd];
    _0x1d845c.write(_0xec86a2.join("\r\n") + "\r\n\r\n");
    activeSockets.add(_0x1d845c);
    _0x1d845c.on("close", () => activeSockets.delete(_0x1d845c));
    _0x1d845c.on("error", () => {
      try {
        _0x1d845c.destroy();
      } catch (_0x4bbc44) {}
    });
    const _0x538837 = _0x91244b => {
      try {
        if (!_0x1d845c.destroyed && _0x1d845c.writable) {
          _0x1d845c.write(encodeWsFrame(_0x91244b));
        }
      } catch (_0x52ad60) {}
    };
    if (_0x105add === "/ws/stats") {
      _0x538837({
        type: "stats",
        data: getSystemStats()
      });
      const _0xc8914f = setInterval(() => {
        if (_0x1d845c.destroyed) {
          clearInterval(_0xc8914f);
          return;
        }
        _0x538837({
          type: "stats",
          data: getSystemStats()
        });
      }, 2000);
      _0x1d845c.on("close", () => clearInterval(_0xc8914f));
      return;
    }
    const _0x1eabce = os.platform() === "win32" ? BASE_DIR : process.env.HOME || "/data/data/com.termux/files/home";
    let _0x1f6852 = _0x1eabce;
    let _0x1383b8 = null;
    const _0x1afcd3 = {
      type: "init",
      message: "DalangStore Web Terminal WebSocket Connected",
      cwd: _0x1f6852
    };
    _0x538837(_0x1afcd3);
    let _0x147729 = _0x2e0ec9 && _0x2e0ec9.length > 0 ? Buffer.from(_0x2e0ec9) : Buffer.alloc(0);
    _0x1d845c.on("data", _0x188259 => {
      try {
        _0x147729 = Buffer.concat([_0x147729, _0x188259]);
        const {
          frames: _0x502da7,
          rest: _0x70431a
        } = decodeWsFrames(_0x147729);
        _0x147729 = _0x70431a;
        for (const _0x402121 of _0x502da7) {
          if (_0x402121.opcode === 8) {
            try {
              _0x1d845c.end(Buffer.from([136, 0]));
            } catch (_0x2f6b00) {}
            return;
          }
          if (_0x402121.opcode === 9) {
            try {
              const _0x25b16c = Buffer.concat([Buffer.from([138, _0x402121.payload.length]), _0x402121.payload]);
              _0x1d845c.write(_0x25b16c);
            } catch (_0x2a77a2) {}
            continue;
          }
          if (_0x402121.opcode === 1) {
            const _0x5c8067 = _0x402121.payload.toString("utf8").trim();
            if (!_0x5c8067) {
              continue;
            }
            let _0x1f2602 = _0x5c8067;
            let _0x57ed66 = _0x1f6852;
            try {
              if (_0x5c8067.startsWith("{") && _0x5c8067.endsWith("}")) {
                const _0x15258f = JSON.parse(_0x5c8067);
                if (_0x15258f.action === "kill" || _0x15258f.action === "sigint") {
                  if (_0x1383b8) {
                    try {
                      if (os.platform() !== "win32") {
                        process.kill(-_0x1383b8.pid, "SIGINT");
                      } else {
                        _0x1383b8.kill("SIGINT");
                      }
                    } catch (_0x3170cd) {}
                  }
                  continue;
                }
                if (_0x15258f.action === "input" && _0x15258f.data !== undefined) {
                  if (_0x1383b8 && _0x1383b8.stdin && !_0x1383b8.stdin.destroyed) {
                    _0x1383b8.stdin.write(_0x15258f.data + "\n");
                  }
                  continue;
                }
                if (_0x15258f.command) {
                  _0x1f2602 = _0x15258f.command;
                }
                if (_0x15258f.cwd) {
                  _0x57ed66 = _0x15258f.cwd;
                }
              }
            } catch (_0x54b54c) {}
            if (_0x57ed66 === "~" || _0x57ed66.startsWith("~/")) {
              _0x57ed66 = path.join(_0x1eabce, _0x57ed66 === "~" ? "" : _0x57ed66.substring(2));
            }
            if (fs.existsSync(_0x57ed66)) {
              _0x1f6852 = _0x57ed66;
            }
            const _0x59fd96 = os.platform() === "win32";
            const _0x2719f5 = "/data/data/com.termux/files/usr/bin/bash";
            const _0x425b55 = _0x59fd96 ? "cmd.exe" : fs.existsSync(_0x2719f5) ? _0x2719f5 : process.env.SHELL || "bash";
            const _0x1e87a0 = "___TERM_PWD___";
            const _0x322098 = _0x59fd96 ? _0x1f2602 + " & echo " + _0x1e87a0 + "%CD%" : _0x1f2602 + "\necho \"" + _0x1e87a0 + "$PWD\"";
            const _0x29d24f = _0x59fd96 ? ["/c", _0x322098] : ["-c", _0x322098];
            const _0x4964da = Object.assign({}, process.env, {
              PYTHONUNBUFFERED: "1",
              FORCE_COLOR: "1",
              TERM: "xterm-256color",
              DEBIAN_FRONTEND: "noninteractive"
            });
            const _0xe57178 = {
              cwd: _0x1f6852,
              env: _0x4964da,
              detached: !_0x59fd96
            };
            const _0x963fd4 = spawn(_0x425b55, _0x29d24f, _0xe57178);
            _0x1383b8 = _0x963fd4;
            const _0x460437 = {
              type: "start",
              command: _0x1f2602,
              pid: _0x963fd4.pid,
              cwd: _0x1f6852
            };
            _0x538837(_0x460437);
            let _0x25b444 = "";
            _0x963fd4.stdout.on("data", _0x52899b => {
              const _0x48622c = _0x52899b.toString("utf8");
              if (_0x48622c.includes(_0x1e87a0)) {
                const _0x207ab1 = _0x48622c.split(_0x1e87a0);
                if (_0x207ab1[0]) {
                  _0x538837({
                    type: "out",
                    data: _0x207ab1[0]
                  });
                }
                _0x25b444 += _0x207ab1.slice(1).join(_0x1e87a0);
              } else if (_0x25b444) {
                _0x25b444 += _0x48622c;
              } else {
                const _0xc0d181 = {
                  type: "out",
                  data: _0x48622c
                };
                _0x538837(_0xc0d181);
              }
            });
            _0x963fd4.stderr.on("data", _0x5d4502 => {
              _0x538837({
                type: "err",
                data: _0x5d4502.toString("utf8")
              });
            });
            _0x963fd4.on("close", _0x3d5e52 => {
              _0x1383b8 = null;
              const _0x2bde52 = _0x25b444.trim().split("\n")[0];
              if (_0x2bde52 && fs.existsSync(_0x2bde52)) {
                _0x1f6852 = _0x2bde52;
              }
              const _0x4a7600 = {
                type: "end",
                exitCode: _0x3d5e52,
                cwd: _0x1f6852
              };
              _0x538837(_0x4a7600);
            });
            _0x963fd4.on("error", _0x58b6f2 => {
              _0x1383b8 = null;
              const _0x5f2aee = {
                type: "err",
                data: "[Error: " + _0x58b6f2.message + "]\n"
              };
              _0x538837(_0x5f2aee);
              const _0x5e063a = {
                type: "end",
                exitCode: 1,
                cwd: _0x1f6852
              };
              _0x538837(_0x5e063a);
            });
          }
        }
      } catch (_0x2da6d9) {}
    });
    _0x1d845c.on("close", () => {
      if (_0x1383b8) {
        try {
          if (os.platform() !== "win32") {
            process.kill(-_0x1383b8.pid, "SIGTERM");
          } else {
            _0x1383b8.kill("SIGTERM");
          }
        } catch (_0x9c87a4) {}
        _0x1383b8 = null;
      }
    });
  } catch (_0x395577) {
    try {
      _0x1d845c.destroy();
    } catch (_0x38ac20) {}
  }
});
server.on("connection", _0x3d77f7 => {
  activeSockets.add(_0x3d77f7);
  _0x3d77f7.on("close", () => activeSockets.delete(_0x3d77f7));
});
server.listen(PANEL_PORT, "0.0.0.0", () => {
  const _0x193c05 = getLocalIPs();
  const _0x399c7b = new Date().toLocaleTimeString("id-ID");
  console.log("[" + _0x399c7b + "] Web Dashboard aktif di Port " + PANEL_PORT);
  _0x193c05.forEach(_0x1d16a3 => {
    console.log("[" + _0x399c7b + "] Akses Lokal: http://" + _0x1d16a3.address + ":" + PANEL_PORT + " (" + _0x1d16a3.iface + ")");
  });
  startPublicTunnel();
  startVpsTunnel();
  setupVpsCliHelpers();
});
process.on("SIGINT", () => {
  console.log(">> [SIGINT Diabaikan] Server diproteksi agar tetap berjalan terus. Gunakan tombol restart di dashboard atau pkill node.");
});
process.on("unhandledRejection", _0x52f3fb => {
  console.error("[unhandledRejection] Ditangkap:", _0x52f3fb && _0x52f3fb.message ? _0x52f3fb.message : String(_0x52f3fb));
});
process.on("uncaughtException", _0x4daac8 => {
  console.error("[uncaughtException] Ditangkap:", _0x4daac8 && _0x4daac8.message ? _0x4daac8.message : String(_0x4daac8));
});