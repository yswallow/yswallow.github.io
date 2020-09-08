function createTanni(kamokuBango, kamokuMei, tannisu) {
    tanni = {
        elements: {
            root: document.createElement("div"),
        },
        kamokuBango: kamokuBango,
        kamokuMei: kamokuMei,
        tannisu: tannisu,
        category: null,

        setParent: function(parentElement){
            parentElement.appendChild(this.elements.root);
        },

        update: function() {
            this.elements.root.innerText = ""+
                this.kamokuBango + " : " +
                this.kamokuMei + " : " + 
                this.tannisu;  
        },
    }

    tanni.update();
    return tanni;
};

function createCategory(name) {
    category = {
        elements: {
            root: document.createElement("div"),
            name: document.createElement("div"),
            addButton: document.createElement("button"),
            list: document.createElement("div"),
        },
        
        name: name,

        update: function() {
            this.elements.name.innerText = this.name;
        },

        setParent: function(parent) {
            parent.appendChild(this.elements.root);
        },
    };

    category.elements.root.setAttribute("class", "category");
    category.elements.addButton.innerText = "ここに単位を追加"
    category.elements.addButton.addEventListener("click", (e)=>{
        Tannis.getActive().setParent(e.target.nextElementSibling);
        Tannis.next();
    });

    category.update();
    NodeTools.appendChildren(
        category.elements.root, category.elements.name, 
        category.elements.addButton, category.elements.list
    );
    return category;
}

window.addEventListener("load", (e)=>{
    elements = {
        sirsCSV: document.getElementById("csv-input"),
        categoryName: document.getElementById("category-name"),
        categoryTannisu: document.getElementById("category-tannisu"),
    }

    Tannis = {
        elements: {
            activeDisplayArea: document.getElementById("active-tanni"),
            uncategorizedTannisArea: document.getElementById("uncategorized-tannis"),
            startButton: document.getElementById("start"),
            addCategoryButtons: function() { return document.getElementsByClassName("add-category")},

        },
        tannis: [],
        active: null,
        activeIndex: -1,
        push: function(item) {
            this.elements.uncategorizedTannisArea.appendChild(item.elements.root);
            this.tannis.push(item);
        },

        next: function() {
            this.elements.activeDisplayArea.innerHTML = "";
            this.activeIndex += 1;
            this.active = this.tannis[this.activeIndex];
            this.active.setParent(this.elements.activeDisplayArea);
            return this.active;
        },

        getActive: function() {
            return this.active;
        }
    }

    Tannis.elements.startButton.addEventListener("click", (e)=>{
        csv = elements.sirsCSV.value;
        lines = csv.split("\n");
        for(i=1; i<lines.length; i++) {
            items = lines[i].split("\",\"");
            kamokuBango = items[2];
            kamokuMei = items[3];
            tannisu = parseFloat(items[4]);
            hyoka = items[7];
            if( hyoka!="F" && hyoka!="D" ) {
                tanni = createTanni(kamokuBango, kamokuMei, tannisu);
                Tannis.push(tanni);
            }
        }
        
        e.target.disabled = true;
        Tannis.next();
    })

    var buttons = Tannis.elements.addCategoryButtons();
    for(i=0; i<buttons.length; i++) {
        buttons[i].addEventListener("click", (e)=>{
            category = createCategory(elements.categoryName.value);
            category.setParent(e.target.parentElement);
        });
    }


});