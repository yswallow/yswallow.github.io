const nrf52_common = {
    device: null,
    col_count: 0,
    row_count: 0,
    cntr_count: 0,
    vendor_report_id: 0,
    col_pins: [],
    row_pins: [],
    pendingReport: false,
    pendingData: [],
    sendReport: function(args) {
        if(this.pendingReport) {
            this.pendingData.append(args)
            return;
        }
        console.log(args);
        this.device.sendReport(this.vendor_report_id, args);
    },
    received: () => {
        if(this.pendingReport) {
            this.pendingReport = false;
            if(this.pendingData.length) {
                this.device.sendReport(this.vendor_report_id, this.pendingData.pop());
                this.pendingReport = true;
            }
        }
    }
};

async function Connect(){
    if("hid" in navigator) {
        const filters = [
            {
                usagePage: 0xFF60,
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
                if(collection.usagePage == 0xFF60) {
                    nrf52_common.vendor_report_id = outputReport.reportId;
                } 
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
        
        if(typeof(connectCallback)=="function") {
            connectCallback();
        }
    } else {
        alert("WebHID API not available.");
    }
}

if("hid" in navigator) {
    console.log("WebHID API available.");
    
    navigator.hid.addEventListener('connect', ({device}) => {
        console.log(`HID connected: ${device.productName}`);
    });
}

nrf52_common.connect = Connect;