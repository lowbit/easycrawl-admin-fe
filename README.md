# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Dashboard Implementation

The dashboard has been implemented with the following features:

1. **Key Metrics**:
   - Total Products
   - Active Jobs
   - Success Rate
   - Error Rate

2. **Charts**:
   - Crawling Activity Trend (Area Chart)
   - Job Status Distribution (Pie Chart)
   - Website Activity (Bar Chart)
   - Products by Category (Pie Chart)

3. **Recent Jobs Table**:
   - Displays the most recent job activities with status, duration, and processed items

### Required Backend APIs

The following APIs need to be implemented on the backend to support the dashboard:

1. **Dashboard Stats API** - `GET /dashboard/stats`
   ```json
   {
     "totalProducts": 256,
     "newProductsThisMonth": 24,
     "activeJobs": 5,
     "activeJobsChange": 20,
     "successRate": 94.5,
     "successRateChange": 2.5,
     "errorRate": 5.5,
     "errorRateChange": -2.5
   }
   ```

2. **Activity Data API** - `GET /dashboard/activity?days=30`
   ```json
   [
     {
       "date": "Jul 01",
       "crawled": 45,
       "processed": 38
     },
     {
       "date": "Jul 02",
       "crawled": 52,
       "processed": 41
     },
     // ...more data points
   ]
   ```

3. **Category Distribution API** - `GET /dashboard/category-distribution`
   ```json
   [
     { "name": "Electronics", "value": 35 },
     { "name": "Clothing", "value": 25 },
     { "name": "Home & Garden", "value": 18 },
     { "name": "Toys", "value": 12 },
     { "name": "Sports", "value": 10 }
   ]
   ```

4. **Website Activity API** - `GET /dashboard/website-activity`
   ```json
   [
     { "name": "Amazon", "crawled": 120, "failed": 5 },
     { "name": "eBay", "crawled": 98, "failed": 3 },
     { "name": "Walmart", "crawled": 86, "failed": 7 },
     { "name": "Target", "crawled": 65, "failed": 2 },
     { "name": "BestBuy", "crawled": 55, "failed": 1 }
   ]
   ```

5. **Job Status Distribution API** - `GET /dashboard/job-status-distribution`
   ```json
   [
     { "name": "Completed", "value": 68 },
     { "name": "In Progress", "value": 12 },
     { "name": "Failed", "value": 8 },
     { "name": "Scheduled", "value": 12 }
   ]
   ```

The dashboard currently uses mock data provided by the `dashboardService.ts` file, which can be replaced with actual API calls once the backend endpoints are implemented.
