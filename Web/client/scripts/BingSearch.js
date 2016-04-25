
var utilObj = {
    hidePara : function(divId) {
        document.getElementById(divId).style.display = "none";
    },
    showBlockPara : function(divId) {
        document.getElementById(divId).style.display = "inline-block";
    },
    setBackgroundColor : function(divId, color) {
        document.getElementById(divId).style.backgroundColor = color;
    },
    clone : function(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        if (obj instanceof Array) {
            var copy = [];
            var i, len;
            for (i = 0, len = obj.length; i < len; ++i) {
                copy[i] = utilObj.clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = utilObj.clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    },
    purge : function(d) {
        var a = d.attributes, i, l, n;
        if (a) {
            for (i = a.length - 1; i >= 0; i -= 1) {
                n = a[i].name;
                if (typeof d[n] === 'function') {
                    d[n] = null;
                }
            }
        }
        a = d.childNodes;
        if (a) {
            l = a.length;
            for (i = 0; i < l; i += 1) {
                utilObj.purge(d.childNodes[i]);
            }
        }
    },
    clearContent : function(tag_Name) {
        var tagRef = document.getElementById(tag_Name);
        utilObj.purge(tagRef);
        tagRef.innerHTML = "";
    },
    setContent : function(tag_Name, content) {
        if (typeof content !== "string") {
            utilObj.clearContent(tag_Name);
        } else {
            var tagRef = document.getElementById(tag_Name);
            utilObj.purge(tagRef);
            tagRef.innerHTML = content;
        }
    },
    //Define the function of adding event listener to element
    addEvent : function(divName, evnt, funct){
        var thElement = document.getElementById(divName);
        if (typeof thElement.addEventListener === "function") {
            utilObj.addEvent = function(divName, evnt, funct) {
                var sElement = document.getElementById(divName);
                sElement.addEventListener(evnt, funct, false);
            }
        } else if (thElement.attachEvent === "function") {
            utilObj.addEvent = function(divName, evnt, funct) {
                var sElement = document.getElementById(divName);
                sElement.attachEvent('on'+evnt, funct);
            }
        } else {
            utilObj.addEvent = function(divName, evnt, funct) {
                var sElement = document.getElementById(divName);
                sElement['on'+evnt] = funct;
            }
        };
        utilObj.addEvent(divName, evnt, funct);
    },
    //add submit event listener to search request button
    addFormListener : function(divName, method) {
        utilObj.addEvent(divName, "submit", function(event) {  
            event.preventDefault();
            method(this.elements);
        })
    },
    addClickFunc : function(divName, funct) {
        var tagName = document.getElementById(divName);
        tagName.onclick = funct;
    },
    requestData : function(med, sendData, callBack) {
        var xhttp, textData;
        textData = JSON.stringify(sendData);
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
        } else {
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var res = [];
                try {
                    res = JSON.parse(xhttp.responseText);
                    callBack(res);
                } catch(err) {
                    console.log("can't process response data.");
                }
            }
        };
        xhttp.open("POST", med, false);
        xhttp.setRequestHeader("Content-type", "application/json;charsetUTF-8")
        xhttp.send(textData);
    }
}

var reTest = {
    isPresented : false,
    buttons : ["addCaller", "ranCaller", "recCaller", "meanChoice"],
    termsNum : 20,
    clearInfo : function() {
        utilObj.clearContent("reCord");
        utilObj.clearContent("testInfo");
    },
    hidde : function() {
        if (!reTest.isPresented) return 0;
        reTest.clearInfo();
        utilObj.hidePara("reCord");
        utilObj.hidePara("testInfo");

        for (var i = 0; i < reTest.buttons.length; i += 1) {
            var tempEle = document.getElementById(reTest.buttons[i]);
            utilObj.purge(tempEle);
            utilObj.hidePara(reTest.buttons[i]);
        }
    },
    startShow : function() {
        if (!myVsearch.hasData) {
            return 0;
        }
        if (!reTest.isPresented) {
            var instance = reduceInterGraph(0, reTest.termsNum, myVsearch.interactGraph);
            reTest.isPresented = true;
            for (var i = 0; i < reTest.buttons.length; i += 1) {
                utilObj.showBlockPara(reTest.buttons[i]);
            }
            utilObj.showBlockPara("reCord");
            utilObj.showBlockPara("testInfo");
            showPerformance(instance);
        } else {
            reTest.hidde();
            reTest.isPresented = false;
        }
    }
}

window.onscroll = function() {
    var topEle = document.getElementById('searchResult');
    var ReTop = topEle.getBoundingClientRect().top;
    if (ReTop < 50) {
        utilObj.showBlockPara("mb");
    } else {
        utilObj.hidePara("mb");
    }
}

function oneDoc(docTitle, docLink, showLink, docContent) {
    this.docTitle = docTitle;
    this.docLink = docLink;
    this.showLink = showLink;
    this.docContent = docContent;
}

oneDoc.prototype.contentList = function() {
    var ctForAnalysing = this.docContent + this.docTitle;
    var tempContent = ctForAnalysing.replace(/<(?:.*?)>/gi, " ")
                            .replace(/[`~!%^&()|?;:'",.<>\{\}\[\]\\\/]/gi, ' ')
                            .replace("\n", " ")
                            .match(/\S+/g);
    var termListRes = [];
    var index,
        lowerCaseTerm,
        len;
    for (index = 0, len = tempContent.length; index < len; index += 1) {
        lowerCaseTerm = tempContent[index].toLowerCase();
        if (STOP_WORDS.indexOf(lowerCaseTerm) != -1 || !isNaN(lowerCaseTerm)) {
            continue;
        } else {
            if (termListRes.indexOf(lowerCaseTerm) == -1 && lowerCaseTerm.length > 1) {
                termListRes.push(lowerCaseTerm);
            }
        }
    }
    return termListRes;
}

function findSentance(source, topic) {
    var docList = myVsearch.termGraph.term2Doc[topic];
    if (!docList) {
        return -1;
    }
    var index, oneDoc, result, len, reTopic, sentance, allSents, posiRdm, posi;
    sentance = -1;
    len = docList.length;
    for (index = 0; index < len; index += 1) {
        posiRdm = Math.floor(Math.random() * len);
        posi = docList[posiRdm];
        if (source != "title") {
            oneDoc = myVsearch.searchResults[posi].docContent;
        } else {
            oneDoc = myVsearch.searchResults[posi].docTitle;
        }
        reTopic = new RegExp(topic, "i");
        result = oneDoc.search(reTopic);
        if (result != -1) {
            if (source != "title") {
                allSents = oneDoc.split(".");
                for (var i = 0; i < allSents.length; i += 1) {
                    if (allSents[i].search(reTopic) != -1) {
                        sentance = allSents[i];
                        break;
                    }
                }
            } else {
                sentance = oneDoc;
            }
            break;
        }
    }
    return sentance;
}

function oneDocFactory(docTitle, docLink, showLink, docContent) {
    return new oneDoc(docTitle, docLink, showLink, docContent);
}

var displayMethod = {
    listTag : document.getElementById("resultsList"),
    infoTag : document.getElementById("ri"),
    groupShowed : false,
    singleShowed : false,
    changeInfoTag : function(numToShow) {
        this.infoTag.innerHTML = numToShow + "results";
    },
    listOneResult : function(results, query) {
        var re = new RegExp(query, "gi");
        var tableOutput = '', markedQuery, isClick;
        if (reOrderList.clickedTerm !== "") {
            isClick = true;
        } else {
            isClick = false;
        }
        if (isClick) {
            markedQuery = '<mark class="markedQuery">' + query + "</mark>";
        }
        var strongLinkQuery = "<b>" + query + "</b>"
        var i, len;
        for (i = 0, len = results.length; i < len; i++) {
            tableOutput += '<li><ul class="oneDoc">'
                + '<li class="rowTitle"><a class="titleLink" href="'
                + decodeURIComponent(results[i].docLink)
                + '" target="_blank">' 
                + results[i].docTitle 
                + "</a></li>" 
                + '<li class="rowLink">' 
                + results[i].showLink.replace(re,strongLinkQuery)
                + "</li>" + '<li class="rowContent">';
            if (isClick) {
                tableOutput += results[i].docContent
                            .replace(/<(?:.*?)>/gi, "")
                            .replace('\n','<br>').replace(re, markedQuery);
            } else {
                tableOutput += results[i].docContent
                            .replace(/<(?:.*?)>/gi, "")
                            .replace('\n','<br>');
            }
            tableOutput += '</li></ul></li>';
        }
        this.listTag.innerHTML = tableOutput;
    },
    listResults2 : function(results) {
        this.groupShowed = true;
        var tagOut = document.getElementById("multiResult");
        var i, j, k, len, titleEachGroup = 3;
        var rowNum = 3, resultShow = "", tableOutput;
        var tagHead, oneGroup = "";
        for (i = 0; i < rowNum; i += 1) {
            tagHead = '<div class="webResultsS"><div class="tt"><div class="riS">';
            tagHead += makeGroup.threeGroup[i] + " results";
            tagHead += '</div><div class="rtS">';
            for (j = 0; j < titleEachGroup; j += 1) {
                tagHead += makeGroup.terms3Group[i][j] + " ";
            }
            tagHead += "</div></div>";
            tableOutput = "<div class='scRes'><ul class='docsS'>";
            for (k = 0, len = results.length; k < len; k++) {
                if (results[k].group == i) {
                    tableOutput += '<li class="oneDocS">'
                    + '<span class="pis">' + (k + 1).toString() + '</span>'
                    + '<ul class="oneLi">'
                    + '<li class="rowTitleS">'
                    + '<a class="titleLinkS" href="'
                    + decodeURIComponent(results[k].docLink)
                    + '" target="_blank">' 
                    + results[k].docTitle 
                    + "</a></li>" 
                    + '<li class="rowLinkS">' 
                    + results[k].showLink
                    + "</li>" + '<li class="rowContentS">' 
                    + results[k].docContent
                        .replace(/<(?:.*?)>/gi, "")
                        .replace('\n','<br>')
                    + '</li></ul></li>';
                } else {
                    //tableOutput += '<li><ul class="oneDoc"></ul></li>';
                }   
            }
            tableOutput += "</ul></div>";
            tagHead += tableOutput + "</div>";
            oneGroup += tagHead;
        }
        tagOut.innerHTML = oneGroup;
    },
    listResults : function(results) {
        this.groupShowed = true;
        var tagOut = document.getElementById("l3l");
        var i, j, k, len, titleEachGroup = 3;
        var rowNum = 3, resultShow = "", tableOutput;
        var tagHead, oneGroup = "", tempId = "";
        tagHead = '<div id="f1d"><div id="f2d"><div id="f3d">';
        // <div class="tt"><div class="riS">';
        // tagHead += makeGroup.threeGroup[i] + " results";
        // tagHead += '</div><div class="rtS">';
        // for (j = 0; j < titleEachGroup; j += 1) {
        //     tagHead += makeGroup.terms3Group[i][j] + " ";
        // }
        // tagHead += "</div></div>";
        tableOutput = "<ul class='docsM'>";
        for (k = 0, len = results.length; k < len; k++) {
            // if (results[k].group == i) {
            switch (results[k].group) {
                case 1:
                    tempId = "dfg1";
                    break;
                case 2:
                    tempId = "dfg2";
                    break;
                default:
                    tempId = "dfg3";
            }
            tableOutput += '<li class="oneDocM ' + tempId + '">'
                        + '<span class="pis">' + (k + 1).toString() + '</span>'
                        + '<ul class="oneLi"'
                        + '<li class="rowTitleS">'
                        + '<a class="titleLinkS" href="'
                        + decodeURIComponent(results[k].docLink)
                        + '" target="_blank">' 
                        + results[k].docTitle 
                        + "</a></li>" 
                        + '<li class="rowLinkS">' 
                        + results[k].showLink
                        + "</li>" + '<li class="rowContentS">' 
                        + results[k].docContent
                            .replace(/<(?:.*?)>/gi, "")
                            .replace('\n','<br>')
                        + '</li></ul></li>'; 
        }
        tableOutput += "</ul>";
        tagHead += tableOutput + '</div></div></div>';
        oneGroup += tagHead;
        tagOut.innerHTML = oneGroup;
        // document.getElementById("f1d").style.height = document.getElementById("f2d").style.height;
        // document.getElementById("f3d").style.height = document.getElementById("f2d").style.height;
    }
}

function Vsearch(query, language, isVP) {
    var acctB64 = "Basic OkRNZWJaQXNiU2NxUmk3Q0xOdUlTbjMrRUxoU1VpTGZDZis1L0dRbHE4ams=";
    var preURL = "https://api.datamarket.azure.com/Bing/Search/v1/Composite?Sources='web'&";
    var sufixURL = "Query='QUERY'&Market='LAN'&$top=50&$skip=0&$format=json";
    var JSONResult = [];
    var xmlHttp = new XMLHttpRequest();
    var item, len2, resSum;
    var searchDict = {};
    var searchRE = [];
    var duplicateChecker = [];
    var theURL = preURL + sufixURL;
    var sURL = theURL.replace("LAN", language)
                .replace("QUERY", encodeURI(query));
    xmlHttp.open("GET", sURL, true);
    xmlHttp.setRequestHeader("Authorization", acctB64);
    xmlHttp.send(null);
    if (isVP) {
        if (myVsearch.psTimes > 5) {
            myVsearch.searchResults.splice(0, 50);
            myVsearch.psTimes = 5;
        }
    }
    windowControl.clearGraph();
    xmlHttp.onreadystatechange = function() {
        if ( xmlHttp.readyState === 4 && xmlHttp.status === 200 ) {
            searchDict = JSON.parse(xmlHttp.responseText);

            resSum = searchDict.d.results[0].WebTotal;
            searchRE = searchDict.d.results[0].Web;
            for (item = 0, len2 = searchRE.length; item < len2; item += 1) {
                if (duplicateChecker.indexOf(searchRE[item].Description) === -1) {
                    JSONResult.push(oneDocFactory(
                                    searchRE[item].Title,
                                    searchRE[item].Url,
                                    searchRE[item].DisplayUrl,
                                    searchRE[item].Description)
                                    );
                    duplicateChecker.push(searchRE[item].Description);
                }
            };
            if (isVP) {
                myVsearch.searchResults = myVsearch.searchResults.concat(JSONResult);
                myVsearch.psTimes += 1;
            } else {
                myVsearch.searchResults = JSONResult;
                myVsearch.psTimes = 1;
            }
            myVsearch.totalNum = myVsearch.searchResults.length;
            if (myVsearch.totalNum == 0) return 0;
            myVsearch.getTheGraphs();
            //new grouping method test
            reControl.isGroupDocsView = ~reControl.isGroupDocsView;
            reControl.changeReView();
            // visualResult(null, true);
        }
    }
};

var reOrderList = {
    newOrderList : [],
    clickedTerm : "",
    cloneResult : function() {
        this.newOrderList = myVsearch.searchResults;
    },
    displayTheOrder : function(startP, query) {
        var endP = startP + 8;
        if (endP > this.newOrderList.length) {
            endP = this.newOrderList.lenght;
        }
        displayMethod.listOneResult(this.newOrderList.slice(startP, endP), query);
    },
    allData : function() {
        if (!myVsearch.hasData) {
            return 0;
        }
        reOrderList.cloneResult();
        displayMethod.changeInfoTag(myVsearch.totalNum);
        reOrderList.clickedTerm = "";
        reOrderList.displayTheOrder(0, reOrderList.clickedTerm);
        pageBar.setPage(1);
    }
}

reOrderList.whichElement = function(event_ID) {
    if (typeof event_ID == "string") {
        if (myVsearch.termGraph.term2Doc.hasOwnProperty(event_ID)) {
            var i, len, index;
            this.newOrderList = [];
            for (i = 0, len = myVsearch.termGraph.term2Doc[event_ID].length; i < len; i++) {
                index = myVsearch.termGraph.term2Doc[event_ID][i];
                this.newOrderList.push(myVsearch.searchResults[index]);
            }
            this.clickedTerm = event_ID;
            pageBar.setPage(1);
            reControl.hideReView();
            displayMethod.changeInfoTag(len);
            this.displayTheOrder(0, event_ID);
        }
    }
}

var myVsearch = {
    termGraph : {},
    psTimes : 0,
    searchResults : [],
    documentGraph : {},
    interactGraph: {},
    lastQuery : "",
    hasData : false,
    totalNum : 0,
    isVPSearch : false,
    searchLang : "",
    searchRequest : function(formData) {
        var input = formData.item(0).value;
        var isVP;
        var language = formData.item(3).value;
        if (language !== "en-US" || language !== "fr-FR") {
            language = "en-US";
        }
        if (formData.item(2).checked) {
            isVP = true;
        } else {
            isVP = false;
        }
        myVsearch.isVPSearch = isVP;
        if (input == "" || input == null) return false;
        if (input == myVsearch.lastQuery && myVsearch.searchLang == language) {
            return false;
        } else {
            Vsearch(input,language, isVP);
            reTest.hidde();
            makeGroup.docsGrouped = false;
            displayMethod.groupShowed = false;
            myVsearch.searchLang = language;
            myVsearch.lastQuery = input;
        }
        return false;
    },
    getTheGraphs : function() {
        myVsearch.hasData = true;
        myVsearch.termGraph = term2Document(myVsearch.searchResults);
        myVsearch.documentGraph = doc2Document(myVsearch.termGraph.term2Doc);
        myVsearch.interactGraph = interactionGraph(myVsearch.documentGraph);
    },
    quickRequest : function(query) {
        Vsearch(query, myVsearch.searchLang, false);
        var formData = document.getElementById("searchInput").elements;
        formData.item(0).value = query;
        reTest.hidde();
        makeGroup.docsGrouped = false;
        displayMethod.groupShowed = false;
    }
}

var pageBar = {
    pageNow : 0,
    perPage : 8,
    firstCall : true,
    setPage : function(pageNum) {
        if (pageNum == 1) {
            utilObj.hidePara("pf1");
        } else {
            utilObj.showBlockPara("pf1");
        }
        var pa2 = document.getElementById("pa2");
        pa2.selectedIndex = pageNum;
        pageBar.pageNow = pageNum;
        pageBar.setPageInfo(pageNum);
    },
    setPageInfo : function(pageValue) {
        var pageNum = "Page: " + pageValue;
        utilObj.setContent("r3", pageNum);
    },
    previousPage : function() {
        if (pageBar.pageNow > 1) {
            var skip2 = pageBar.perPage * (pageBar.pageNow - 2);
            reOrderList.displayTheOrder(skip2, reOrderList.clickedTerm);
            pageBar.pageNow -= 1;
            pageBar.setPage(pageBar.pageNow);
        }
    },
    nextPage : function() {
        if (pageBar.pageNow != 0) {
            var skip2 = pageBar.perPage * pageBar.pageNow;
            if (skip2 > reOrderList.newOrderList.length) {
                return 0;
            }
            reOrderList.displayTheOrder(skip2, reOrderList.clickedTerm);
            pageBar.pageNow += 1;
            pageBar.setPage(pageBar.pageNow);
        }
    },
    changePage : function() {
        if (this.value == 0 || pageBar.pageNow == 0) {
            pageBar.setPage(pageBar.pageNow);
        } else {
            var skip2 = pageBar.perPage * (this.value - 1);
            if (skip2 > reOrderList.newOrderList.length) {
                pageBar.setPage(pageBar.pageNow);
                return 0;
            }
            var pageNum = this.value;
            if (pageNum == 1) {
                utilObj.hidePara("pf1");
            }
            reOrderList.displayTheOrder(skip2, reOrderList.clickedTerm);
            pageBar.pageNow = parseInt(pageNum);
            pageBar.setPageInfo(pageNum);
        }
    }
}

var makeGroup = {
    groupsInfo : {},
    groupNum : 0,
    searchGroups : 3,
    docsGrouped : false,
    groupTheGraph : function(initialInterGraph, groupSize) {
        makeGroup.groupsInfo = {};
        var groupFinal = initialInterGraph;
        if (!initialInterGraph.hasOwnProperty('termsArrs') || initialInterGraph.termsArrs.length < groupSize) {
            getMatrixVertiMax(groupFinal);
            getTermsGroups(groupFinal);
            optimiseGroup(groupFinal);
            
            regroupTerms(groupFinal);
            createTermsArr(groupFinal);
            getOptiGroup(groupFinal);
        } 
        reduceGroup(groupSize, groupFinal);
        console.log(groupFinal);
        var i, j, len, len2, leaf, leafList, tempInfo = {};

        for (i = 0, len = groupFinal.termsArrs.length; i < len; i += 1) {
            leafList = groupFinal.termsArrs[i];
            for (j = 0, len2 = leafList.length; j < len2; j += 1) {
                leaf = leafList[j];
                term = groupFinal.nodes[leaf];
                tempInfo[term.text] = i + 1;
                term.group = i + 1;
            }
        }
        makeGroup.groupNum = len;
        makeGroup.groupsInfo = tempInfo;
    },
    groupTheDocs : function(interGraph) {
        makeGroup.groupTheGraph(interGraph, makeGroup.searchGroups);
        makeGroup.docsGrouped = true;
        var threeGroups = [];
        var groupD, oneDocTerms, term, i, j, len, index, tempSize;
        for (tempSize = 0; tempSize < makeGroup.searchGroups; tempSize += 1) {
            threeGroups.push([]);
        }
        for (term in makeGroup.groupsInfo) {
            index = makeGroup.groupsInfo[term] - 1;
            threeGroups[index].push(term);
        }
        var doc3 = [];
        for (tempSize = 0; tempSize < makeGroup.searchGroups; tempSize += 1) {
            doc3.push(0);
        }
        for (i = 0; i < myVsearch.totalNum; i += 1) {
            oneDocTerms = myVsearch.searchResults[i].contentList();
            groupD = [];
            for (tempSize = 0; tempSize < makeGroup.searchGroups; tempSize += 1) {
                groupD.push(0);
            }
            for (j = 0, len = oneDocTerms.length; j < len; j += 1) {
                term = oneDocTerms[j];
                for (var k = 0; k < makeGroup.searchGroups; k += 1) {
                    if (threeGroups[k].indexOf(term) != -1) {
                        groupD[k] += 1;
                    }
                }
            }
            index = groupD.indexOf(Math.max.apply(Math, groupD));
            if (index === -1) {
                index = 2;
                console.log("excpet");
            }
            doc3[index] += 1;
            myVsearch.searchResults[i].group = index;
        }
        makeGroup.terms3Group = threeGroups;
        makeGroup.threeGroup = doc3;
    }
}

var reControl = {
    isGroupDocsView : false,
    hideReView : function() {
        utilObj.showBlockPara("singleResult");
        utilObj.hidePara("multiResult");
    },
    changeReView : function() {
        if (!myVsearch.hasData) {
            return 0;
        }
        var pageApp = document.getElementById("mlp");
        if (this.isGroupDocsView) {
            reOrderList.allData();
            pageApp.innerHTML = "&#9783;";
            this.isGroupDocsView = false;
            utilObj.showBlockPara("singleResult");
            utilObj.hidePara("multiResult");
        } else {
            if (!displayMethod.groupShowed) {
                makeGroup.groupTheDocs(myVsearch.interactGraph);
                displayMethod.listResults(myVsearch.searchResults);
            }
            pageApp.innerHTML = "&#9868;";
            utilObj.hidePara("singleResult");
            utilObj.showBlockPara("multiResult");
            this.isGroupDocsView = true;
        }
    }
}

var windowControl = {
    windowList : {},
    currentWindow : "",
    changeWindow : function(tag_Name) {
        if (!myVsearch.hasData) return 0;
        if (windowControl.currentWindow === tag_Name) {
            return 0;
        } else if (tag_Name === "hd") {
            if (windowControl.currentWindow !== "") {
                windowControl.clearGraph();
            }
            return 0;
        }
        if (windowControl.currentWindow !== "") {
            document.getElementById(windowControl.currentWindow).className = "tl";
            if (windowControl.windowList[windowControl.currentWindow])
                windowControl.windowList[windowControl.currentWindow].hideWin();
        } else {
            utilObj.showBlockPara("d3Graphs");
        };
        var result = windowControl.windowList[tag_Name];
        if (!result) {
            result = windowControl.addWindow(tag_Name);
        };
        windowControl.currentWindow = tag_Name;
        document.getElementById(windowControl.currentWindow).className = "tlClicked";
        if (windowControl.windowList[windowControl.currentWindow])
            result.showWin();
    },
    clearGraph : function() {
        for (var item in windowControl.windowList) {
            if (windowControl.windowList[item]) {
                windowControl.windowList[item].clearGraphContent();
                windowControl.windowList[item].hideWin();
                delete windowControl.windowList[item];
            }
        };
        if (windowControl.currentWindow !== "") {
            document.getElementById(windowControl.currentWindow).className = "tl";
            windowControl.currentWindow = "";
        }
        utilObj.hidePara("d3Graphs");
    },
    addWindow : function(windowName) {
        windowControl.windowList[windowName] = graphRequest(windowName);
        return windowControl.windowList[windowName];
    }
};

(function() {
    
    utilObj.addFormListener("searchInput", myVsearch.searchRequest);

    //add visualization request event listener 
    var tls = document.getElementsByClassName('tl');

    for (var i = 0; i < tls.length; i += 1) {
        tls[i].addEventListener("click", function() {
            windowControl.changeWindow(this.id);
        })
    };
    //add mouse hove and out event listener
    var mouseOverReact = function(tag1, tag2) {
        var ele1 = document.getElementById(tag1);
        var ele2 = document.getElementById(tag2);
        utilObj.addEvent(tag1, "mouseover", function() {
            ele2.style.display = "inline-block";
        });
        utilObj.addEvent(tag1, "mouseout", function() {
            ele2.style.display = "none";
        });
        utilObj.addEvent(tag2, "mouseover", function() {
            ele2.style.display = "inline-block";
        });
        utilObj.addEvent(tag2, "mouseout", function() {
            ele2.style.display = "none";
        });
    };

    utilObj.addEvent("mlp", "click", reControl.changeReView);
    utilObj.addEvent("t1", "click", reTest.startShow);
    utilObj.addEvent("pf1", "click", pageBar.previousPage);
    utilObj.addEvent("pf2", "click", pageBar.nextPage);
    utilObj.addEvent("pa2", "change", pageBar.changePage);
    utilObj.addEvent("rt", "click", reOrderList.allData);
    utilObj.addEvent("mb", "click", function() {
        window.scrollTo(0, 0);
    });

    var mouseListenerEles = {
        apPara1 : "tppg",
        gpPara1 : "tppgo",
        apPara2 : "sppgp",
        gpPara2 : "sppgo",
        apPara3 : "mppgp",
        gpPara3 : "mppgo",
        apPara4 : "bppgp",
        gpPara4 : "bppgo",
        apPara5 : "dppgp",
    }

    for (var i in mouseListenerEles) {
        mouseOverReact(i, mouseListenerEles[i]);
    }

})();
