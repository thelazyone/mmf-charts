import * as echarts from 'echarts';
import * as Papa from 'papaparse';

// Parameters
const timeIncrementsDays = 7;
const averageWindowDefaultDays = 30;
const earningString = "Creator Net Earnings Amount (Item Price - 8% Commission - Payment Processing Fees)";

// HTML elements
const loadFilesButton = document.getElementById('load-files') as HTMLButtonElement;
const welcomeContainer = document.getElementById('welcome-container') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const dashboardContainer = document.getElementById('dashboard') as HTMLElement;
const selectAllButton = document.getElementById('select-all') as HTMLElement;
const selectNoneButton = document.getElementById('select-none') as HTMLElement;
const recalculateButton = document.getElementById('recalculate') as HTMLElement;
const movingAverageWindowInput = document.getElementById('moving-average-window') as HTMLInputElement;
const itemList = document.getElementById('item-list') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;

// Global objects:
const loadedData: any[] = [];
let productsList: Map<string, string>;
let firstProductSale: Date;
let lastProductSale: Date;
// Plots dashboards
interface DashboardCharts {
  chart1: echarts.ECharts;
  //chart2: echarts.ECharts;
}
let dashboardCharts: DashboardCharts | undefined;

// Event Listeners

// Loads Button
loadFilesButton.addEventListener('click', () => {
  fileInput.click();
});

// Select All Items Radio Button
selectAllButton.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#item-list input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    (checkbox as HTMLInputElement).checked = true;
  });

  // Call the function to regenerate the graphs based on the selected items
  updateGraphs();
});

// Deselect All Items Radio Button
selectNoneButton.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#item-list input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    (checkbox as HTMLInputElement).checked = false;
  });
  // Call the function to regenerate the graphs based on the selected items
  updateGraphs();
});

// Recalculate Button
recalculateButton.addEventListener('click', () => {
  // Call the function to regenerate the graphs based on the selected items
  updateGraphs();
});

// Redraw Graphs if item list updates
itemList.addEventListener('change', () => {
  // Call the function to regenerate the graphs based on the selected items
  //updateGraphs();
});

fileInput.addEventListener('change', async (event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name.endsWith('.csv')) {
      const data = await readAndParseCSVFile(file);
      loadedData.push(...data);
    }
  }

  // Add this line to sort the loadedData by date
  loadedData.sort((a: any, b: any) => new Date(a["Date"]).getTime() - new Date(b["Date"]).getTime());

  console.log("there are " + loadedData.length + " entires.");
  console.log(loadedData);

  dashboardCharts = createDashboard(loadedData, averageWindowDefaultDays);

  // Wrap the style changes in an async function and call it
  async function updateStyles() {
    welcomeContainer.style.display = 'none';
    loadFilesButton.style.display = 'none';
    dashboardContainer.style.display = 'flex';
  }

  updateStyles();
  resizeCharts(dashboardCharts);
  window.dispatchEvent(new Event('resize'));

  // Creating the list of products and users:
  productsList = createItemIdNameMap(loadedData);
  const usersList = createUserCountryMap(loadedData);
  createItemList(productsList);
});

searchInput.addEventListener('input', () => {
  const searchValue = searchInput.value.toLowerCase();
  const tableRows = itemList.getElementsByTagName('tr');
  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    const itemName = row.children[1].textContent ? row.children[1].textContent.toLowerCase() : '';
    if (itemName.includes(searchValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }
});

// Utilty functions: 
async function readAndParseCSVFile(file: File): Promise<any[]> {
  const text = await readFileAsText(file);
  const parsedData = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsedData.data;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function createItemIdNameMap(data: any[]): Map<string, string> {
  const itemIdNameMap = new Map<string, string>();

  for (const row of data) {
    const itemId = row["Item ID"];
    var itemName = row["Item Name"];

    if (!itemIdNameMap.has(itemId) || (itemIdNameMap.has(itemId) && itemIdNameMap.get(itemId) != itemId)) {
      var cleanedItemName = itemName;
      if (cleanedItemName.includes("Battlefields of Tomorrow - ")) {
        cleanedItemName = cleanedItemName.split("Battlefields of Tomorrow - ")[1]
      }

      itemIdNameMap.set(itemId, cleanedItemName);
    }
  }

  return itemIdNameMap;
}

function createUserCountryMap(data: any[]): Map<string, string> {
  const userCountryMap = new Map<string, string>();

  for (const row of data) {
    const buyerUsername = row["Buyer Username"];
    const country = row["Country"];

    if (!userCountryMap.has(buyerUsername)) {
      userCountryMap.set(buyerUsername, country);
    }
  }

  return userCountryMap;
}

function createItemList(itemIdNameMap: Map<string, string>) {
  const itemList = document.getElementById('item-list') as HTMLElement;

  // Create a div to wrap the table
  const tableWrapper = document.createElement('div');
  tableWrapper.classList.add('table-wrapper');

  // Create a table
  const table = document.createElement('table');
  table.classList.add('item-table');

  // Create header row
  const headerRow = document.createElement('tr');
  const headerLabels = ['Checked', 'Product Name', 'Total Profit'];
  headerLabels.forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Fill the table with item names and their total profits
  for (const [itemId, itemName] of itemIdNameMap.entries()) {
    const totalProfit = calculateTotalProfit(itemId, loadedData);

    const tr = document.createElement('tr');

    const checkboxTd = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = itemName;
    input.checked = true;
    checkboxTd.appendChild(input);
    tr.appendChild(checkboxTd);

    const itemNameTd = document.createElement('td');
    itemNameTd.textContent = itemName;
    tr.appendChild(itemNameTd);

    const totalProfitTd = document.createElement('td');
    totalProfitTd.textContent = totalProfit.toFixed(2);
    tr.appendChild(totalProfitTd);

    table.appendChild(tr);
  }

  tableWrapper.appendChild(table);
  itemList.appendChild(tableWrapper);
}

// Updating the graphs with the right content.
function updateGraphs() {
  // Get the selected items from the list
  const selectedItems = new Set<string>();
  const checkboxes = document.querySelectorAll('#item-list input[type="checkbox"]:checked');
  checkboxes.forEach((checkbox) => {
    selectedItems.add((checkbox as HTMLInputElement).value);
  });

  // Filter the data based on the selected items
  console.log("selected items:")
  selectedItems.forEach(element => {
    console.log(element); // 👉️ bobby, hadz, com
  });
  const filteredData = loadedData.filter((row: any) => {
    // Checking if the selected items list (which is made of strings) contains 
    // the string corresponding to the ID of the required item.
    const shortName = productsList.get(row["Item ID"]) as string;
    return selectedItems.has(shortName);

    //console.log("short: " + shortName)
  });

  console.log("filteredData has " + filteredData.length + " items instead of " + loadedData.length);

  // Get the moving average window size from the input field
  const windowSize = parseInt(movingAverageWindowInput.value) || averageWindowDefaultDays;

  // Call the function to update the graphs with the filtered data and the moving average window size
  dashboardCharts = createDashboard(filteredData, windowSize);
  resizeCharts(dashboardCharts);
  window.dispatchEvent(new Event('resize'));
}


function createDashboard(data: any, windowSize: number) {
  // Preparing the data for the charts:
  const profits = data.map((row: any) => Number(row[earningString]));
  const dates = data.map((row: any) => new Date(row["Date"]));

  // Defining the new temporal steps: 
  firstProductSale = new Date(data[0]["Date"]);
  lastProductSale = new Date(data[data.length - 1]["Date"]);
  const dateRange = generateDateRange(firstProductSale, lastProductSale);
  function generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dateRange: Date[] = [];
    let currentDate = new Date(startDate);
  
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + timeIncrementsDays);
    }
  
    return dateRange;
  }

  // Calculate the cumulative profits
  let cumulativeProfit = 0;
  const cumulativeProfits = dateRange.map((currentDate: Date) => {
    const soldItemsOnOrBeforeCurrentDate = data.filter((row: any) => {
      const date = new Date(row["Date"]);
      return date <= currentDate;
    });
  
    const sum = soldItemsOnOrBeforeCurrentDate.reduce((total: number, row: any) => {
      return total + Number(row[earningString]);
    }, 0);
  
    cumulativeProfit = sum;
    return cumulativeProfit;
  });

  // Calculate the moving average profits (daily)
  const movingAverageProfits = dateRange.map((currentDate: Date) => {
    const halfWindowSize = Math.floor(windowSize / 2);
  
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - halfWindowSize);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + halfWindowSize);
  
    const windowData = data.filter((row: any) => {
      const date = new Date(row["Date"]);
      return date >= startDate && date <= endDate;
    });
  
    const sum = windowData.reduce((total: number, row: any) => {
      return total + Number(row[earningString]);
    }, 0);
  
    const average = sum / windowSize;
    return average;
  });

  // Preparing the plots layout:
  const chartContainer1 = document.getElementById('chart-container-1');
  //const chartContainer2 = document.getElementById('chart-container-2');

  const chart1 = echarts.init(chartContainer1 as HTMLElement);
  //const chart2 = echarts.init(chartContainer2 as HTMLElement);

  const option1 = {
    title: {
      text: 'Selected Products Profits\n(' + firstProductSale + " - " + lastProductSale + ")",
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        animation: false
      }
    },
    legend: {
      data: ['Cumulative', 'Averaged'],
      left: 10
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
      }
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: 'all'
        }
      ]
    },
    dataZoom: [
      {
        show: true,
        realtime: true,
        start: 0,
        end: 100,
        xAxisIndex: [0, 1]
      },
      {
        type: 'inside',
        realtime: true,
        start: 0,
        end: 100,
        xAxisIndex: [0, 1]
      }
    ],
    grid: [
      {
        left: '5%',
        right: '5%',
        top: '15%',
        height: '35%',
        containLabel: true,
      },
      {
        left: '5%',
        right: '5%',
        top: '55%',
        height: '35%',
        containLabel: true,
      },
    ],

    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        axisLine: { onZero: true },
        data: dateRange
      },
      {
        gridIndex: 1,
        type: 'category',
        boundaryGap: false,
        axisLine: { onZero: true },
        data: dateRange,
        position: 'top'
      }
    ],
    yAxis: [
      {
        name: 'Total Profit ($)',
        type: 'value',
      },
      {
        gridIndex: 1,
        name: 'Daily Average Profit ($)',
        type: 'value',
        inverse: true
      }
    ],

  series: [
    {
      name: 'Cumulative Profit',
      type: 'line',
      symbolSize: 8,
      // prettier-ignore
      data: cumulativeProfits
    },
    {
      name: 'Daily Profit averaged',
      type: 'line',
      xAxisIndex: 1,
      yAxisIndex: 1,
      symbolSize: 8,
      // prettier-ignore
      data: movingAverageProfits
    }
  ]
};


  chart1.setOption(option1);
  //chart2.setOption(option2);

  //return { chart1, chart2 };
  return { chart1 };
}


function resizeCharts(charts: DashboardCharts) {
  if (dashboardCharts && dashboardCharts.chart1) {
    dashboardCharts.chart1.resize();
  }
}


window.addEventListener('resize', () => {
  if (dashboardCharts) {
    resizeCharts(dashboardCharts);
  }
});


// TODO calculate this only once.
function calculateTotalProfit(itemId: string, data: any[]): number {
  const itemData = data.filter((row: any) => row["Item ID"] === itemId);
  const totalProfit = itemData.reduce((total: number, row: any) => {
    return total + Number(row[earningString]);
  }, 0);
  return totalProfit;
}