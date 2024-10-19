export function selectMongoTemplate(collection: string) {
  return {
      selectAll: `db.${collection}.find({})`,
  };
}

export default selectMongoTemplate;
