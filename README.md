
# How to update EC2 instance
## Broad steps:
1. Build static version of the project with `npm start build`
   - This is so that we don't have to do a `npm start` server to keep the page running
     - and also we don't need to have `nodejs` or `npm` installed on the ec2 instance (i tried to do that before, and it was extrememly slow and didn't end up working; but that might've just been me)
   - `npm run build` creates a `\build\` folder that contains the minimum that our page needs to run
2. `scp` the build folder to the EC2 instance
   - `scp` is "secure copy". it's how we can move files from our machine to another (the EC2 instance)
   - we just need to navigate to where our secret key is and run `scp -i <YOUR_SECRET_KEY> <PATH/TO>\build\ <YOUR_USER>@<EC2_PUBLIC_IP>:/home/shared/projects/wormhole-chess/`
     - ^ this command should give you a visual update that files were copied
3. `ssh` into the EC2 instance
   - navigate to where your secret key is (same as above)
   - run `ssh -i <YOUR_SECRET_KEY> <YOUR_USER>@<EC2_PUBLIC_IP>`
     - this should give you a visual that you are in the EC2 terminal
   - we need to go in and move the contents of the `\build\` folder to where they will be served from 
   - We specify where the files will be served from in an `nginx` config (topic for another time)
   - right now, our config says it will look for files at `/var/www/wormhole-chess` (from the absolute root directory)
4. `cp` the build folder to the place where it is served from 
   - run `sudo cp <PATH_TO>/build/* var/www/wormhole=chess/`
And the webpage should automatically update when new files are in that folder. (might need to empty browser cache on your browser)

## Just the commands
   Navigate to this folder (same as this `README.md`)
0. Make sure your updated (`git pull` and such)
1. `npm run build`
   Navigate to EC2-PRIVATE-KEY folder
2. `scp -i <YOUR_SECRET_KEY> <PATH/TO>\build\ <YOUR_USER>@<EC2_PUBLIC_IP>:/home/shared/projects/wormhole-chess/`
3. `ssh -i <YOUR_SECRET_KEY> <YOUR_USER>@<EC2_PUBLIC_IP>`
4. (In the EC2 Shell) `sudo cp -r /home/shared/projects/wormhole-chess/build/* /var/www/wormhole-chess/`
   






# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
