/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the SDK running on vouchsdk.onrender.com
  async rewrites() {
    return []
  },
}

module.exports = nextConfig