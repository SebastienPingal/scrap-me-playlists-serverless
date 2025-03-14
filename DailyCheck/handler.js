exports.run = async () => {
  const time = new Date();
  console.log(`🕒 Your cron function ran at ${time} your variables are ${process.env.SPOTIFY_CLIENT_ID} and ${process.env.SPOTIFY_CLIENT_SECRET}`);
};
