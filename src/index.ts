import * as echarts from 'echarts';
import * as Papa from 'papaparse';

// HTML elements
const loadFilesButton = document.getElementById('load-files') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const dashboardContainer = document.getElementById('dashboard') as HTMLElement;
const selectAllButton = document.getElementById('select-all') as HTMLElement;
const selectNoneButton = document.getElementById('select-none') as HTMLElement;
const itemList = document.getElementById('item-list') as HTMLElement;

// Global Function
const loadedData: any[] = [];

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

// Redraw Graphs if item list updates
itemList.addEventListener('change', () => {
  // Call the function to regenerate the graphs based on the selected items
  updateGraphs();
});

// Redraw Graphs if item input files change
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

  console.log("there are " + loadedData.length + " entires.");
  console.log(loadedData);

  createDashboard(loadedData);

  // Wrap the style changes in an async function and call it
  async function updateStyles() {
    loadFilesButton.style.display = 'none';
    dashboardContainer.style.display = 'flex';
  }

  updateStyles();
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
      if (itemName.split("-").length > 0) {
        itemName = itemName.split('-')[1]
      }

      itemIdNameMap.set(itemId, itemName);
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

// Filling content
function createItemList(itemIdNameMap: Map<string, string>) {
  const itemList = document.getElementById('item-list') as HTMLElement;

  // Fill the item list with item names
  for (const itemName of itemIdNameMap.values()) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = itemName;
    input.checked = true;
    label.appendChild(input);
    label.appendChild(document.createTextNode(itemName));
    itemList.appendChild(label);
    itemList.appendChild(document.createElement('br'));
  }
}

function updateGraphs() {
  // Get the selected items from the list
  const selectedItems = new Set<string>();
  const checkboxes = document.querySelectorAll('#item-list input[type="checkbox"]:checked');
  checkboxes.forEach((checkbox) => {
    selectedItems.add((checkbox as HTMLInputElement).value);
  });

  // Filter the data based on the selected items
  const filteredData = loadedData.filter((row) => selectedItems.has(row["Item Name"]));

  // Call the function to update the graphs with the filtered data
  createDashboard(filteredData);
}

function createDashboard(data: any) {

  // Creating the list of products: 
  var productsList = createItemIdNameMap(data);
  console.log("products list: " + productsList);

  var usersList = createUserCountryMap(data);
  console.log("users list: " + usersList);

  createItemList(productsList);

  // Preparing the plots layout:
  const chartContainer1 = document.getElementById('chart-container-1');
  const chartContainer2 = document.getElementById('chart-container-2');

  const chart1 = echarts.init(chartContainer1 as HTMLElement);
  const chart2 = echarts.init(chartContainer2 as HTMLElement);

  const option1 = {
    // Configure your first chart's options here
  };

  const option2 = {
    // Configure your second chart's options here
  };

  chart1.setOption(option1);
  chart2.setOption(option2);

  // Add resize event listener to make the charts responsive
  window.addEventListener('resize', () => {
    chart1.resize();
    chart2.resize();
  });
}