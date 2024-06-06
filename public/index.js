const surveyId = "1";

function init(json) {
  var survey = new Survey.SurveyModel(json);

  SurveyAnalyticsTabulator.Table.showFilesAsImages = true;

  function getPaginatedData({ offset, limit, filter, sort}) {
    const endpointUrl = "/api/pagedresults";
    const params = { offset, limit, filter, sort, postId: surveyId };
    const url = new URL(window.location.origin + endpointUrl);
    url.search = new URLSearchParams(params).toString();
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json().then(result => resolve(result)))
        .catch(() => reject());
    });
  }

  // var normalizedData = data.map(function (item) {
  //   survey.getAllQuestions().forEach(function (q) {
  //     if (!item[q.name]) {
  //       item[q.name] = "";
  //     }
  //   });
  //   return item;
  // });

  // function getPaginatedData({ offset, limit, filter, sort }) {
  //   console.log(JSON.stringify(filter));
  //   console.log(JSON.stringify(sort));
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       resolve({ data: normalizedData.slice(offset, offset + limit), totalCount: normalizedData.length });
  //     }, 1000);
  //   });
  // }

  var surveyAnalyticsTabulator = new SurveyAnalyticsTabulator.Tabulator(
    survey,
    getPaginatedData
  );

  surveyAnalyticsTabulator.render("tabulatorContainer");
}

fetch("/api/getSurvey?surveyId=" + surveyId).then(res => res.json()).then(survey => init(survey.json));