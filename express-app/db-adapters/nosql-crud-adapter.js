function choiceTransformationPipeline(result) {
  let res = {};
  result.forEach(item => {
    res[item._id] = item.count;
  });
  return res;
}
function numberTransformationPipeline(result) {
  if (result.length == 0) return { value: 0, minValue: 0, maxValue: 0 };
  return { value: result[0].average, minValue: result[0].min, maxValue: result[0].max };
}
function histogramTransformationPipeline(result) {
  let res = [];
  result.forEach(item => {
    res.push(item.count);
  });
  return res; 
}
const transformers = {
  "boolean": choiceTransformationPipeline,
  "radiogroup": choiceTransformationPipeline,
  "dropdown": choiceTransformationPipeline,
  "checkbox": choiceTransformationPipeline,
  "tagbox": choiceTransformationPipeline,
  "number": numberTransformationPipeline,
  "rating": numberTransformationPipeline,
  "histogram": histogramTransformationPipeline
}

function NoSqlCrudAdapter (dbConnectFunction, getId) {
  function getObjects (collectionName, filter, callback) {
    filter = filter || [];
    let query = {};
    filter.forEach(fi => query[fi.field] = fi.value);
    dbConnectFunction((db, finalizeCallback) => {
      db.collection(collectionName).find(query).toArray()
        .then((results) => {
          callback(results);
          finalizeCallback(results);
        })
        .catch(() => {
          console.error(JSON.stringify(arguments));
        });
      }
    );
  }

  function getObjectsPaginated (collectionName, filter, order, offset, limit, callback) {
    filter = filter || [];
    let query = {};
    filter.forEach(fi => {
      if (!!fi.value) {
        let val = fi.value;
        query[fi.field] = val;
      }
    });
    let sort = {};
    order.forEach(fi => {
      sort[fi.field] = fi.value == "desc" ? -1 : 1;
    });
    console.log("getObjectsPaginated:");
    console.log("filter: ", JSON.stringify(filter));
    console.log("order: ", JSON.stringify(order));
    console.log("query: ", JSON.stringify(query));
    console.log("sort: ", JSON.stringify(sort));
    dbConnectFunction((db, finalizeCallback) => {
      db.collection(collectionName).count(query).then(count => {
        db.collection(collectionName).find(query).sort(sort).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
          .then((results) => {
            const result = { data: results, totalCount: count };
            callback(result);
            finalizeCallback(result);
          })
          .catch(() => {
            console.error(JSON.stringify(arguments));
          });
      });
    });
  }

  function retrieveSummary (collectionName, surveyId, questionId, questionType, visualizerType, filter, callback) {
    var singleChoicePipline = [
      { $match: { postid: surveyId } },
      { $project: { value: "$json." + questionId } },
      { $match: { value: { $exists: true } } },
      {
        $group: {
          _id: "$value",
          count: { $sum: 1 },
        }
      }
    ];
    var multipleChoicePipline = [
      { $match: { postid: surveyId } },
      { $project: { value: "$json." + questionId } },
      { $match: { value: { $exists: true } } },
      { $unwind: "$value" },
      {
        $group: {
          _id: "$value",
          count: { $sum: 1 },
        }
      }
    ];
    var numberPipline = [
      { $match: { postid: surveyId } },
      { $project: { value: "$json." + questionId } },
      { $match: { value: { $exists: true } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          average: { $avg: "$value" },
          min: { $min: "$value" },
          max: { $max: "$value" },
          values: { $push: "$value" }
        }
      }
    ];
    var histogramPipeline = [
      { $match: { postid: surveyId } },
      { $project: { value: "$json." + questionId } },
      { $match: { value: { $exists: true } } },
      {
        $bucketAuto: {
          groupBy: "$value",
          buckets: 3,
          output: {
            count: { $sum: 1 },
            minValue: { $min: "$value" },
            maxValue: { $max: "$value" }
          }
        }
      },
      {
        $project: {
          _id: 0,
          interval: {
            $concat: [
              { $toString: { $round: ["$minValue", 2] } },
              " - ",
              { $toString: { $round: ["$maxValue", 2] } }
            ]
          },
          count: 1
        }
      }
    ];
    const mongoPiplines = {
      "boolean": singleChoicePipline,
      "radiogroup": singleChoicePipline,
      "dropdown": singleChoicePipline,
      "checkbox": multipleChoicePipline,
      "tagbox": multipleChoicePipline,
      "number": numberPipline,
      "rating": numberPipline,
      "histogram": histogramPipeline
    }
    dbConnectFunction((db, finalizeCallback) => {
      const pipeline = mongoPiplines[visualizerType] || mongoPiplines[questionType] || [];
      db.collection(collectionName).aggregate(pipeline).toArray()
        .then((results) => {
          const transformer = transformers[visualizerType] || transformers[questionType] || (r => r);
          const result = transformer(results);
          callback(result);
          finalizeCallback(result);
        })
        .catch(() => {
          console.error(JSON.stringify(arguments));
        });
    });
  }

  function deleteObject (collectionName, idValue, callback) {
    dbConnectFunction((db, finalizeCallback) => {
      db.collection(collectionName).deleteMany({ id: idValue })
        .then((results) => {
          callback(results);
          finalizeCallback(results);
        })
        .catch(() => {
          console.error(JSON.stringify(arguments));
        });
      }
    );
  }

  function createObject (collectionName, object, callback) {
    object.id = object.id || getId();
    dbConnectFunction((db, finalizeCallback) => {
      db.collection(collectionName).insertOne(object)
        .then((results) => {
          callback(object.id);
          finalizeCallback(results);
        })
        .catch(() => {
          console.error(JSON.stringify(arguments));
        });
      }
    );
  }

  function updateObject (collectionName, object, callback) {
    dbConnectFunction((db, finalizeCallback) => {
      db.collection(collectionName).updateOne({ id: object.id }, { $set: object })
        .then((results) => {
          callback(results);
          finalizeCallback(results);
        })
        .catch(() => {
          console.error(JSON.stringify(arguments));
        });
      }
    );
  }

  return {
    create: createObject,
    retrieve: getObjects,
    update: updateObject,
    delete: deleteObject,
    retrievePaginated: getObjectsPaginated,
    retrieveSummary: retrieveSummary
  }
}

module.exports = NoSqlCrudAdapter;