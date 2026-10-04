import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import { ROLES } from "../../../constants/roles.js";
import { normalizePhone } from "../../../utils/phone.js";
import { isDbConnected } from "../../../config/db.js";
import mockStore from "../../../services/mockStore.js";

export const list = async ({ role, search, page = 1, limit = 20 }) => {
  if (!isDbConnected()) {
    return mockStore.listUsers({ role, search, page, limit });
  }

  const filter = {};
  if (role) filter.role = role;

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { username: rx },
      { phone: rx },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

export const getById = async (id) => {
  if (!isDbConnected()) {
    const user = mockStore.findUserById(id);
    if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi");
    const copy = { ...user };
    delete copy.passwordHash;
    return copy;
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi");
  return user;
};

export const update = async (id, body) => {
  if (!isDbConnected()) {
    const user = mockStore.findUserById(id);
    if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi");
    if (user.role === ROLES.OWNER) {
      throw new ApiError(403, "Owner foydalanuvchini tahrirlab bo'lmaydi");
    }

    const updates = {};
    if (body.firstName !== undefined) updates.firstName = body.firstName.trim();
    if (body.lastName !== undefined) updates.lastName = body.lastName.trim();
    if (body.isActive !== undefined) updates.isActive = !!body.isActive;
    if (body.phone !== undefined) {
      const phone = body.phone ? normalizePhone(body.phone) : null;
      if (body.phone && !phone) throw new ApiError(400, "Telefon raqam noto'g'ri");
      updates.phone = phone || undefined;
    }
    if (body.birthDate !== undefined) {
      updates.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }
    if (body.gender !== undefined) updates.gender = body.gender || null;
    if (body.address !== undefined) updates.address = body.address || "";

    const updated = mockStore.updateUser(id, updates);
    const copy = { ...updated };
    delete copy.passwordHash;
    return copy;
  }

  const user = await getById(id);
  if (user.role === ROLES.OWNER) {
    throw new ApiError(403, "Owner foydalanuvchini tahrirlab bo'lmaydi");
  }

  if (body.firstName !== undefined) user.firstName = body.firstName.trim();
  if (body.lastName !== undefined) user.lastName = body.lastName.trim();
  if (body.isActive !== undefined) user.isActive = !!body.isActive;

  if (body.phone !== undefined) {
    const phone = body.phone ? normalizePhone(body.phone) : null;
    if (body.phone && !phone) throw new ApiError(400, "Telefon raqam noto'g'ri");
    user.phone = phone || undefined;
  }

  if (body.birthDate !== undefined) {
    user.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  }
  if (body.gender !== undefined) {
    user.gender = body.gender || null;
  }
  if (body.address !== undefined) {
    user.address = body.address || "";
  }

  await user.save();
  return user;
};

export const softRemove = async (id) => {
  if (!isDbConnected()) {
    const user = mockStore.findUserById(id);
    if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi");
    if (user.role === ROLES.OWNER) {
      throw new ApiError(403, "Owner foydalanuvchini o'chirib bo'lmaydi");
    }
    const removed = mockStore.removeUser(id);
    const copy = { ...removed };
    delete copy.passwordHash;
    return copy;
  }

  const user = await getById(id);
  if (user.role === ROLES.OWNER) {
    throw new ApiError(403, "Owner foydalanuvchini o'chirib bo'lmaydi");
  }
  user.isActive = false;
  await user.save();
  return user;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
