# TaskFlow Core Features

Here is a breakdown of how the main parts of the app actually work.

## 1. Role-Based Access (RBAC)
I set up a custom middleware to lock down routes based on user roles.
* **Admin:** Basically God mode. They create tasks, set deadlines, and can delete anything.
* **Manager:** The middleman. They look at open tasks, claim them, and assign them to workers.
* **User:** The worker. They only see what is assigned to them and update the status when they start or finish work.

## 2. Manager Assignment Search
Initially, I had managers typing in 36-character UUIDs to assign tasks, which was a terrible user experience. I swapped this out for a live search endpoint (`GET /users/search?q=`). On the backend, it uses Sequelize's `Op.like` to filter names, and on the frontend, it auto-fetches results as you type.

## 3. The Task State Machine
Tasks can't just jump around randomly. They follow a strict path:
Open -> Claimed -> Assigned -> In-Progress -> Completed. 
(Admins can force them back to 'Reopened' if the work was bad).

## 4. Discussion & Logs
* **Logs:** Every time a task status changes, the database logs who did it and when.
* **Comments:** A basic chat board on each task. I used eager loading on the backend to attach the author's role to the comment so users know if an Admin is talking to them.

## 5. What I'm Building Next: Geotagging
I am planning to add a feature for field workers where they can snap a photo to prove they finished a job. It will use Expo's camera and location libraries to grab their GPS coordinates and upload the image to the backend via Multer.