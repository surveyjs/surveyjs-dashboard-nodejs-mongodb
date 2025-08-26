const surveyId = "1";

function getSummaryData({ visualizer, filter }) {
  const endpointUrl = "/api/questionsummary";
  const params = {
    surveyId: surveyId,
    questionId: visualizer.name,
    questionType: visualizer.question.getType(),
    visualizerType: visualizer.type,
    filter: JSON.stringify(filter)
  };
  const url = new URL(window.location.origin + endpointUrl);
  url.search = new URLSearchParams(params).toString();
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json().then(result => resolve(result.data)))
      .catch(() => reject());
  });
}

function init(json) {
  const survey = new Survey.SurveyModel(json);
  const questionsToVisualize = [
    survey.getQuestionByName("satisfaction"),
    survey.getQuestionByName("recommend friends"),
    survey.getQuestionByName("price to competitors"),
    survey.getQuestionByName("price")
  ];
  const vizPanel = new SurveyAnalytics.VisualizationPanel(
    questionsToVisualize, // survey.getAllQuestions()
    getSummaryData,
    {}
  );
  vizPanel.render(document.getElementById("summaryContainer"));
}

fetch("/api/getSurvey?surveyId=" + surveyId).then(res => res.json()).then(survey => init(survey.json));
