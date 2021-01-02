var openlpChannel = new BroadcastChannel("obs_openlp_channel");

window.OpenLP = {
    updateServiceList : function() {
        $.getJSON("/api/service/list").then( (data, status) => {
            var $serviceList = $("#service-list").empty();
            data.results.items.forEach( (item, i) => {
                var { id, title, selected } = item;
                var $item = $(`<div class="service-item${selected ? " selected" : ""}"/>`);
                $item.html(title)
                    .click( () => {
                        $.post(`/api/service/set?data={"request": {"id": ${i}}}`);
                    });

                $serviceList.append($item);            
            });
        });
    },
    updateTextList: function(newSlide) {
        $.getJSON("/api/controller/live/text").then( (data, status) => {
            this.currentSlides = data.results.slides;
            this.currentRows = [];

            var $textList = $("#text-list").empty();
            data.results.slides.forEach( (slide, i) => {
                var { text } = slide;

                var rows = this.slideToRows(text);
                rows.forEach( rowText => {
                    var row = this.currentRows.length;

                    if(this.currentRow === null && this.currentSlide === i) {
                        this.currentRow = row;
                    }

                    var selected = row === this.currentRow;
                    this.currentRows.push(rowText);

                    if(selected) {
                        openlpChannel.postMessage(rowText);
                        var $live = $("#live").empty().html(rowText);
                    }

                    var $row = $(`<div class="text-item${selected ? " selected" : ""}"/>`);
                    $row.html(rowText)
                        .click( () => {
                            this.currentRow = row;
                            if(this.currentSlide !== i) {
                                this.currentSlide = i;
                                $.post(`/api/controller/live/set?data={"request": {"id": ${i}}}`);
                            }
                            this.updateTextList();
                        });

                    $textList.append($row);            
                });


            });
        })
    },
    slideToRows : function(slideText){
        var rows = [];

        if(this.modeTampilan === "original"){
            rows.push(slideText.replace("\n", "<br>"));
        }
        else if(this.modeTampilan === "2-line") {
            var lines = slideText.split("\n");
            for (var i = 0; i < lines.length; i+=2) {
                var nextLine = lines[i+1];
                nextLine = nextLine ? ("<br>" + nextLine) : "";
                var row = lines[i] + nextLine;
                rows.push(row);
            }
        }
        return rows;
    },
    pollServer : function() {
        $.getJSON("/api/poll").then( (data, status) => {
            if (this.currentItem != data.results.item ||
                this.currentService != data.results.service) {
                this.currentItem = data.results.item;
                this.currentService = data.results.service;
                this.currentSlide = 0;
                this.currentRow = 0;

                this.updateServiceList();
                this.updateTextList();
            } else if (this.currentSlide != data.results.slide) {
                this.currentSlide = parseInt(data.results.slide, 10);
                this.currentRow = null;
                this.updateTextList();
            }
        });
    },
    setModeTampilan: function(mode) {
        this.currentSlide = 0;
        this.currentRow = 0;
        this.modeTampilan = mode;
        $(`input[name="mode-tampilan"][value="${mode}"]`).prop('checked', true);
        this.updateTextList();
    }
}

$(function () {
    $.ajaxSetup({cache: false});
    setInterval( () => {
        OpenLP.pollServer();
    }, 250);

    OpenLP.setModeTampilan("original");
    $('input[type=radio][name="mode-tampilan"]').change( (evt) => {
        OpenLP.setModeTampilan(evt.target.value);
    });
});

