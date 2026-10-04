import bcrypt from "bcrypt";
import crypto from "crypto";

const OWNER_PASSWORD_HASH = bcrypt.hashSync("owner123", 10);
const STUDENT_PASSWORD_HASH = bcrypt.hashSync("student123", 10);

const initialUsers = [
  {
    _id: "674000000000000000000001",
    firstName: "Bosh",
    lastName: "Ega",
    username: "owner",
    phone: "+998901234567",
    passwordHash: OWNER_PASSWORD_HASH,
    role: "owner",
    isActive: true,
    birthDate: new Date("1995-01-01"),
    gender: "male",
    address: "Toshkent",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    _id: "674000000000000000000002",
    firstName: "Ali",
    lastName: "Valiyev",
    username: "student",
    phone: "+998907654321",
    passwordHash: STUDENT_PASSWORD_HASH,
    role: "student",
    isActive: true,
    birthDate: new Date("2005-05-15"),
    gender: "male",
    address: "Samarqand",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    _id: "674000000000000000000003",
    firstName: "Hasanboy",
    lastName: "Abdulkhayev",
    username: "xasanboyman",
    phone: "+998909998877",
    passwordHash: OWNER_PASSWORD_HASH,
    role: "owner",
    isActive: true,
    birthDate: new Date("1995-01-01"),
    gender: "male",
    address: "Toshkent",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

const roles = {
  owner: {
    value: "owner",
    label: "Tizim egasi",
    permissions: ["*"],
  },
  student: {
    value: "student",
    label: "O'quvchi",
    permissions: [
      "users.read",
      "activity_logs.read",
      "lab.access",
      "chemistry.view",
      "biology.view",
      "physics.view",
    ],
  },
};

const users = [...initialUsers];
const refreshTokens = [];
const activityLogs = [];

export const mockStore = {
  // === Users ===
  findUserByLogin(login) {
    const trimmed = String(login || "").trim().toLowerCase();
    return (
      users.find(
        (u) =>
          u.username.toLowerCase() === trimmed || (u.phone && u.phone === login),
      ) || null
    );
  },

  findUserById(id) {
    const strId = String(id);
    return users.find((u) => String(u._id) === strId) || null;
  },

  listUsers({ role, search, page = 1, limit = 20 }) {
    let filtered = [...users];
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)),
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const items = filtered.slice(skip, skip + limit).map((u) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });

    return { items, total, page, limit };
  },

  createUser(userData) {
    const _id = crypto.randomBytes(12).toString("hex");
    const now = new Date();
    const newUser = {
      _id,
      ...userData,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    return newUser;
  },

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  },

  removeUser(id) {
    const user = this.findUserById(id);
    if (!user) return null;
    user.isActive = false;
    user.updatedAt = new Date();
    return user;
  },

  // === Roles & Permissions ===
  getPermissionsForRole(role) {
    if (role === "owner") return ["*"];
    return roles[role]?.permissions || [];
  },

  roleExists(role) {
    return Boolean(roles[role]);
  },

  // === Refresh Tokens ===
  createRefreshToken({ user, tokenHash, userAgent, ip, expiresAt }) {
    const tokenDoc = {
      _id: crypto.randomBytes(12).toString("hex"),
      user: String(user),
      tokenHash,
      userAgent: userAgent || "",
      ip: ip || "",
      expiresAt: new Date(expiresAt),
      revokedAt: null,
      createdAt: new Date(),
    };
    refreshTokens.push(tokenDoc);
    return tokenDoc;
  },

  findValidRefreshToken(tokenHash) {
    const now = new Date();
    return (
      refreshTokens.find(
        (t) =>
          t.tokenHash === tokenHash &&
          t.revokedAt === null &&
          new Date(t.expiresAt) > now,
      ) || null
    );
  },

  revokeRefreshToken(tokenHash) {
    let revoked = null;
    const now = new Date();
    for (const t of refreshTokens) {
      if (t.tokenHash === tokenHash && t.revokedAt === null) {
        t.revokedAt = now;
        revoked = t;
      }
    }
    return revoked;
  },

  cleanupExpiredTokens() {
    const now = new Date();
    for (let i = refreshTokens.length - 1; i >= 0; i--) {
      if (
        refreshTokens[i].revokedAt ||
        new Date(refreshTokens[i].expiresAt) <= now
      ) {
        refreshTokens.splice(i, 1);
      }
    }
  },

  // === Activity Logs ===
  createLog(data) {
    const doc = {
      _id: crypto.randomBytes(12).toString("hex"),
      ...data,
      createdAt: new Date(),
    };
    activityLogs.unshift(doc);
    if (activityLogs.length > 500) {
      activityLogs.pop();
    }
    return doc;
  },

  listLogs({
    userId,
    method,
    resourceType,
    fromDate,
    toDate,
    page = 1,
    limit = 30,
  }) {
    let filtered = [...activityLogs];
    if (userId) filtered = filtered.filter((l) => String(l.user) === String(userId));
    if (method) filtered = filtered.filter((l) => l.method === method);
    if (resourceType)
      filtered = filtered.filter((l) => l.resourceType === resourceType);
    if (fromDate) {
      const fd = new Date(fromDate);
      filtered = filtered.filter((l) => new Date(l.createdAt) >= fd);
    }
    if (toDate) {
      const td = new Date(toDate);
      filtered = filtered.filter((l) => new Date(l.createdAt) <= td);
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const items = filtered.slice(skip, skip + limit).map((l) => {
      const userDoc = l.user ? this.findUserById(l.user) : null;
      return {
        ...l,
        user: userDoc
          ? {
              _id: userDoc._id,
              firstName: userDoc.firstName,
              lastName: userDoc.lastName,
              username: userDoc.username,
              role: userDoc.role,
            }
          : null,
      };
    });

    return { items, total, page, limit };
  },

  getLogById(id) {
    const strId = String(id);
    const log = activityLogs.find((l) => String(l._id) === strId);
    if (!log) return null;
    const userDoc = log.user ? this.findUserById(log.user) : null;
    return {
      ...log,
      user: userDoc
        ? {
            _id: userDoc._id,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            username: userDoc.username,
            role: userDoc.role,
          }
        : null,
    };
  },

  getLogStats({ fromDate, toDate } = {}) {
    let filtered = [...activityLogs];
    if (fromDate) {
      const fd = new Date(fromDate);
      filtered = filtered.filter((l) => new Date(l.createdAt) >= fd);
    }
    if (toDate) {
      const td = new Date(toDate);
      filtered = filtered.filter((l) => new Date(l.createdAt) <= td);
    }

    const methodMap = {};
    const resourceMap = {};
    const userMap = {};

    for (const l of filtered) {
      methodMap[l.method] = (methodMap[l.method] || 0) + 1;
      if (l.resourceType) {
        resourceMap[l.resourceType] = (resourceMap[l.resourceType] || 0) + 1;
      }
      if (l.user) {
        userMap[l.user] = (userMap[l.user] || 0) + 1;
      }
    }

    const byMethod = Object.entries(methodMap).map(([_id, count]) => ({
      _id,
      count,
    }));
    const byResource = Object.entries(resourceMap).map(([_id, count]) => ({
      _id,
      count,
    }));

    const topUsers = Object.entries(userMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => {
        const u = this.findUserById(userId);
        return {
          userId,
          firstName: u ? u.firstName : "",
          lastName: u ? u.lastName : "",
          role: u ? u.role : "",
          count,
        };
      });

    return {
      total: filtered.length,
      byMethod,
      byResource,
      topUsers,
    };
  },
};

export default mockStore;
