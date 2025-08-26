# SurveyJS Dashboard - Server-Side Data Processing Demo Example

This example shows how to configure a server that can paginate, sort, filter, and otherwise process survey data and integrate this server with the [SurveyJS Dashboard](https://surveyjs.io/dashboard/examples/interactive-survey-data-dashboard/) and [Table View](https://surveyjs.io/dashboard/examples/export-survey-results-to-csv-files/). The example uses a NodeJS server with a MongoDB database as a storage.

## Disclaimer

This demo must not be used as a real service as it doesn't cover such real-world survey service aspects as authentication, authorization, user management, access levels, and different security issues. These aspects are covered by backend-specific articles, forums, and documentation.

## Run the Application

1. Install [NodeJS](https://nodejs.org/) and [Docker Desktop](https://docs.docker.com/desktop/) on your machine.

2. Run the following commands:

    ```bash
    git clone https://github.com/surveyjs/surveyjs-dashboard-table-view-nodejs-mongodb.git
    cd surveyjs-dashboard-table-view-nodejs-mongodb
    docker compose up -d
    ```

3. Open http://localhost:9080 in your web browser.

## Implement Server-Side Data Processing

### Dashboard (Charts)

The Dashboard displays aggregated survey results as charts. By default, it loads all user responses from storage and processes them in the browser, which can significantly slow down loading. To improve performance, you can offload data aggregation to the server and return only the calculated statistics.

The Dashboard is created using the [`VisualizationPanel`](https://surveyjs.io/dashboard/documentation/api-reference/visualizationpanel) constructor. Its second parameter is a callback function that the Dashboard calls whenever it needs to re-calculate data. This function receives an object with the following properties:

- `visualizer`: `any`       
A single chart instance. Provides access to the survey question it visualizes.

- `filter`: `Array<{ field: string, type: string, value: any }>`       
Filter conditions that should be applied to the dataset. The filter format is based on [Tabulator filters](https://tabulator.info/docs/6.3/filter).

On the server, use these parameters to [build aggregation pipelines](https://github.com/surveyjs/surveyjs-dashboard-table-view-nodejs-mongodb/blob/94abdd173750aa111b4f3aa4f14642dc3fdcf3a0/express-app/db-adapters/nosql-crud-adapter.js#L82-L158) and apply them to your dataset. The raw results may not match the Dashboard's expected format, so you'll need to [transform the data](https://github.com/surveyjs/surveyjs-dashboard-table-view-nodejs-mongodb/blob/94abdd173750aa111b4f3aa4f14642dc3fdcf3a0/express-app/db-adapters/nosql-crud-adapter.js#L1-L28) before returning it.

For a complete example, see the [`retrieveSummary`](https://github.com/surveyjs/surveyjs-dashboard-table-view-nodejs-mongodb/blob/94abdd173750aa111b4f3aa4f14642dc3fdcf3a0/express-app/db-adapters/nosql-crud-adapter.js#L81-L172) function, which demonstrates how the server should handle load parameters and return processed results.

### Table View

Table View displays unaggregated user responses in a table. Without server-side data processing, the Table View may take more time to launch, because it loads all user responses from a storage in one batch and processes them in the user's browser. To shorten the loading time, you can delegate sorting and filtering to the server and implement data pagination to load data in small batches.

The Table View is instantiated using the `Tabulator` constructor, which accepts a function as a second parameter. This function is called each time the Table View requests the next batch of user responses. Its argument is an object with the following properties:

- `offset`: `number`      
The number of records to skip from the beginning of the dataset. Used to implement data pagination.

- `limit`: `number`      
The number of records to load in the current batch. Used to implement data pagination.

- `filter`: `Array<{ field: string, type: string, value: any }>`       
Filter conditions that should be applied to the dataset. Refer to the [Tabulator documentation](https://tabulator.info/docs/6.3/filter) for information on available filters.

- `sort`: `{ field: string, direction: undefined | "asc" | "desc" }`      
Sort order settings that should be applied to the dataset.

- `callback`: `(response: { data: Array<Object>, totalCount: number, error?: any }) => void })`       
A callback used to return the processed dataset. Instead of using the callback, the function can return a Promise.

Pass these load parameters in a server request. The server should apply them to the dataset and return processed data back to the client in an object with the following structure: `{ data: Array<Object>, totalCount: number, error?: any }`. Refer to the [`getObjectsPaginated`](https://github.com/surveyjs/surveyjs-dashboard-table-view-nodejs-mongodb/blob/94abdd173750aa111b4f3aa4f14642dc3fdcf3a0/express-app/db-adapters/nosql-crud-adapter.js#L48-L79) function implementation for an example of how the server should handle the load parameters.

## Related Demo Examples

- [SurveyJS + NodeJS + MongoDB Demo Example](https://github.com/surveyjs/surveyjs-nodejs-mongodb)
- [SurveyJS + NodeJS + PostgreSQL Demo Example](https://github.com/surveyjs/surveyjs-nodejs-postgresql)

## SurveyJS Resources

- [Website](https://surveyjs.io/)
- [Documentation](https://surveyjs.io/dashboard/documentation/overview)
- [Starter Demos](https://surveyjs.io/dashboard/examples/interactive-survey-data-dashboard/)
- [What's New](https://surveyjs.io/stay-updated/major-updates/2024)
