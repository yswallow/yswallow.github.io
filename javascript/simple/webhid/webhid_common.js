const nrf52_common = {
    device: null,
    col_count: 0,
    row_count: 0,
    cntr_count: 0,
    col_pins: [],
    row_pins: [],
    pendingReport: false,
    pendingData: [],
    sendReport: (...args) =>{
        if(this.pendingReport) {
            this.pendingData.append(args)
            return;
        }
        this.device.sendReport(...args);
    },
    received: () => {
        if(this.pendingReport) {
            this.pendingReport = false;
            if(this.pendingData.length) {
                this.device.sendReport(...this.pendingData.pop());
                this.pendingReport = true;
            }
        }
    }
};

async function Connect(){
    if("hid" in navigator) {
        console.log("WebHID API available.");
        
        navigator.hid.addEventListener('connect', ({device}) => {
            console.log(`HID connected: ${device.productName}`);
        });
        const filters = [
            {
                
            }
        ];
        [device] = await navigator.hid.requestDevice({ filters });
        
        nrf52_common.device = device;
        device.addEventListener("inputreport", parseHidResponse);

	    console.log(`productName: ${device.productName}`); 
        for (let collection of device.collections) {
            console.log(`Usage: ${collection.usage}`);
            console.log(`UsagePage: ${collection.usagePage}`);
            for (let inputReport of collection.inputReports) {
                console.log(`Input report ID: ${inputReport.reportId}`);
                // Loop through inputReport.items
            }

            for (let outputReport of collection.outputReports) {
                console.log(`Output report ID: ${outputReport.reportId}`);
            // Loop through outputReport.items
            }

            for (let featureReport of collection.featureReports) {
                console.log(`Feature report ID: ${featureReport.reportId}`);
            // Loop through featureReport.items
            }

            // Loop through subcollections with collection.children
        }
        if(! device.opened) {
            await device.open();
            console.log( device );
        }
        device.sendReport(0x00, new Uint8Array([0x02,0x06]));
        device.sendReport(0x00, new Uint8Array([0x02,0x04]));
        device.sendReport(0x00, new Uint8Array([0x02,0x05]));
        
    } else {
        alert("WebHID API not available.");
    }
}

nrf52_common.connect = Connect;