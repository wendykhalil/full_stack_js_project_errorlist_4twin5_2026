/**
 * Generate a video conference link using independent Jitsi instance
 * This instance is not behind Cloudflare, so should be accessible globally
 * Free, unlimited rooms, no API key required
 */
function generateMeetingLink(meetingId) {
  const id = String(meetingId);
  // Use first 12 characters of ID as room name (unique and simple)
  const roomId = id.substring(0, 12).toLowerCase();
  
  // Use a different Jitsi instance that's not Cloudflare-blocked
  // jitsi.riot.im is a community-run instance
  return `https://jitsi.riot.im/${roomId}`;
}

module.exports = { generateMeetingLink };

