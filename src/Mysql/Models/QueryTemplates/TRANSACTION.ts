const transactionTemplate = () => {
  return {
    begin: `START TRANSACTION \n`,
    commit: `COMMIT \n`,
    rollback: `ROLLBACK \n`,
  };
};

export default transactionTemplate;
