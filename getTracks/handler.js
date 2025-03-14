exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Salut une playlist a été ajoutée à S3'
    })
  };
};
