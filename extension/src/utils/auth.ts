export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const BASE_URL = "http://localhost:3000"; // Adjust for production

export const authActions = {
  async getTokens(): Promise<Tokens | null> {
    const data = await browser.storage.local.get([
      "accessToken",
      "refreshToken",
    ]);
    if (data.accessToken && data.refreshToken) {
      return data as Tokens;
    }
    return null;
  },

  async setTokens(tokens: Tokens) {
    await browser.storage.local.set(tokens);
  },

  async clearTokens() {
    await browser.storage.local.remove(["accessToken", "refreshToken"]);
  },

  async exchangeCodeForTokens(code: string): Promise<Tokens | null> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Token exchange failed: ${response.status} ${errorData.error || ""}`
        );
      }

      const tokens = await response.json();
      await this.setTokens(tokens);
      return tokens;
    } catch (error) {
      console.error("Auth error:", error);
      return null;
    }
  },

  async refreshTokens(): Promise<Tokens | null> {
    const tokens = await this.getTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is likely expired or revoked
        await this.clearTokens();
        return null;
      }

      const newTokens = await response.json();
      await this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error("Refresh error:", error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return !!tokens;
  },
};
