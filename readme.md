# Charting tool for MyMiniFactory sellers
This tool comes out of necessity, as I needed something to get a quicker way to access the sales of my MyMiniFactory store while retrieving the right kind of data. In particular (not all are implemented yet): 
* Tracking together the sales of a group of different products
* Visualizing a moving average of the sales
* Defining groups of products, with partial % of individual products, in case of collaborative projects
* Not relying on the MMF archive solely. If one day a wipe occurs it's good to have a second tool to keep tracking.

Live Demo (updated April 26th 2023): https://test.thelazyforger.com/mff-chart/ - Note that you'll have to load your own .csv files. The files are loaded locally, and nothing is sent to our server.

# Installation
For the moment the tool works through npm and webpack.

Install webpack: <code>npm install --save-dev webpack webpack-cli ts-loader</code>
Same for echarts: <code>npm install --save echarts</code>
And for papaparse: <code>npm install --save papaparse</code>

To avoid local paths to mess stuff up, I've added webpack as part of the local scripts of the package.json. this way, you can package the project every time you call <code>npm run build</code>.

I'd recommend the "Live Server" plugin for VSCode to open your solution locally with one click, but I'm sure there's plenty of other options too.

