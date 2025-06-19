const puppeteer = require('puppeteer');
const path = require('path');

async function testCustomAccountWidget() {
  console.log('Starting Custom Account Widget visual test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  });
  
  const page = await browser.newPage();
  
  // Load the test HTML file
  const testFilePath = `file://${path.join(__dirname, 'test-widget.html')}`;
  await page.goto(testFilePath);
  
  console.log('\n✅ Test page loaded successfully');
  console.log('📍 URL:', testFilePath);
  
  // Take screenshot of all widget states
  await page.screenshot({ 
    path: 'widget-test-screenshot.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved as widget-test-screenshot.png');
  
  // Test hover effects
  console.log('\n🖱️  Testing hover effects...');
  const buttons = await page.$$('button');
  
  for (let i = 0; i < buttons.length; i++) {
    await buttons[i].hover();
    await page.waitForTimeout(500); // Let hover effect show
    console.log(`  - Hovered over button ${i + 1}`);
  }
  
  // Test click functionality
  console.log('\n👆 Testing click functionality...');
  await buttons[0].click();
  console.log('  - Clicked first button (would open modal in real app)');
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser will stay open for manual inspection.');
  console.log('   Check that the widget matches the design requirements.');
  console.log('   Press Ctrl+C to close when done.\n');
  
  // Wait indefinitely until user closes
  await new Promise(() => {});
}

// Run the test
testCustomAccountWidget().catch(console.error);