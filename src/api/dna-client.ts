export const auth = {
  async getCurrentUser() {
    return null;
  },

  async signIn(email: string, password: string) {
    return { email };
  },

  async signOut() {
    return true;
  },
};
