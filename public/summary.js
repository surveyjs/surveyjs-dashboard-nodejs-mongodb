const surveyId = "1";

function getSummaryData({ visualizer, filter }) {
  console.log("Question: " + JSON.stringify(visualizer.name));
  console.log("Filter: " + JSON.stringify(filter));
  const endpointUrl = "/api/questionsummary";
  const params = { surveyId: surveyId, questionId: visualizer.name, questionType: visualizer.question.getType(), visualizerType: visualizer.type, filter: JSON.stringify(filter) };
  const url = new URL(window.location.origin + endpointUrl);
  url.search = new URLSearchParams(params).toString();
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json().then(result => {
        console.log("params: " + JSON.stringify(params));
        console.log("result: " + JSON.stringify(result));
        resolve(result.data);
      }))
      .catch(() => reject());
  });
}

function init (json) {
  var survey = new Survey.SurveyModel(json);
  var visPanel = new SurveyAnalytics.VisualizationPanel(
    [ survey.getQuestionByName("satisfaction"), survey.getQuestionByName("recommend friends"), survey.getQuestionByName("price to competitors"), survey.getQuestionByName("price") ],
    // survey.getAllQuestions(),
    getSummaryData,
    {}
  );
  visPanel.showToolbar = true;
  visPanel.render(document.getElementById("summaryContainer"));
}

fetch("/api/getSurvey?surveyId=" + surveyId).then(res => res.json()).then(survey => init(survey.json));
