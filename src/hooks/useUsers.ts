import { create } from "zustand";

import { mockUsers } from "@/data/mock";
import type { PlatformUser, UserStatus } from "@/types/user";

// In-memory users list so suspend / activate / delete are reflected across
// the user pages. Replace with service calls once the users API exists.
type UsersState = {
  users: PlatformUser[];
  setStatus: (id: string, status: UserStatus) => void;
  deleteUser: (id: string) => void;
};

export const useUsers = create<UsersState>()((set) => ({
  users: mockUsers,
  setStatus: (id, status) =>
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, status } : user)),
    })),
  deleteUser: (id) =>
    set((state) => ({ users: state.users.filter((user) => user.id !== id) })),
}));
