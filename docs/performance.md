# Performance Tweaks & Optimizations

While building this prototype, I ran into a few bottlenecks. Here is how I fixed them to make the app run smoother.

## 1. Redis Session Caching
At first, checking if a user was logged in meant querying the main Postgres `Users` table on every single API hit. That felt really inefficient. I set up Redis to store the hashed session tokens in memory instead. It drastically sped up authentication for protected routes.

## 2. Fixing N+1 Queries
When loading the Task Details screen, I needed to pull the task data, the creator's name, the assignee's name, the comments, and the logs. Making 5 or 6 separate API calls was slow. I rewrote the backend controllers to use Sequelize's `include` arrays (Eager Loading) so it all comes back in one clean SQL JOIN query.

## 3. React Native Grid Layout Bug
I had an issue where toggling between the List view and Grid view in the app caused the cards to squish together into a thin orange line. I fixed this by dynamically changing the flex width (setting it to 48% when in grid mode) and forcing the FlatList to re-render by changing its `key` prop.

## 4. Database Cleanup (Cascading Deletes)
I realized that if an Admin deleted a task, all the comments and logs for that task were being left behind in the database as orphaned rows. I updated the database migrations to include `ON DELETE CASCADE` for the foreign keys. Now, Postgres cleans up the related data automatically.