/* global window, jQuery, moment, Mustache */

(function (window, $, moment, mustache) {
    "use strict";

    var templates = {}, rowsPerPage = 20;

    function pageNavigationHelper () {
        return function (content, render) {

            var pageNum, nav = [], navLinksLimit = 5, data = this;

            for (pageNum = Math.max(0, parseInt(data.offset / rowsPerPage, 10) - 2);
                 pageNum < parseInt(data.total_rows / rowsPerPage, 10) && navLinksLimit--;
                 pageNum++) {

                nav.push({
                    title: pageNum + 1,
                    num: pageNum,
                    active: pageNum === parseInt(data.offset / rowsPerPage, 10)
                });
            }

            this.isFirst = data.offset < rowsPerPage;
            this.prev = parseInt(data.offset / rowsPerPage, 10) - 1;
            this.nav = nav;
            this.next = parseInt(data.offset / rowsPerPage, 10) + 1;
            this.isLast = data.offset >= data.total_rows - rowsPerPage;

            return render(content);
        };
    }

    function dateTimeHelper (format, includeFromNow) {
        return function () {
            return function (content, render) {
                var date = moment(render(content));
                return date.format(format) + (includeFromNow ? ', ' + date.fromNow() : '');
            };
        };
    }

    function printJsonAsHtmlHelper () {
        return function () {
            var html = '<dl>', key, json = this;

            for (key in json) {
                if (json.hasOwnProperty(key) && (['_id', '_rev', 'timestamp', 'message', 'channel'].indexOf(key) === -1)) {
                    if (typeof json[key] === 'object') {
                        html += printJsonAsHtmlHelper(json[key]);
                    } else {
                        html += '<dt>' + key + '</dt>';
                        html += '<dd>' + json[key] + '</dd>';
                    }
                }
            }
            return html + '</dl>';
        };
    }

    function registerHelpers (view) {
        view.h_dateTimeList = dateTimeHelper("D.MM.YYYY HH:mm", 'fromNow');
        view.h_dateTimeRecord = dateTimeHelper("D MMM YYYY HH:mm:ss.SSS");
        view.h_pageNav = pageNavigationHelper;
        view.h_prettyJson = printJsonAsHtmlHelper;

        return view;
    }

    window.renderer = {

        loadTemplates: function (done) {

            $.when(
                $.get('mustache/list.mustache', function (template) {
                    templates.list = mustache.compile(template);
                }),
                $.get('mustache/record.mustache', function (template) {
                    templates.record = mustache.compile(template);
                }),
                $.get('mustache/paginator.mustache', function (template) {
                    mustache.compilePartial('paginator', template);
                }),
                $.get('mustache/page-nav.mustache', function (template) {
                    mustache.compilePartial('nav', template);
                })
            ).then(done);

        },

        renderList: function (view) {
            return templates.list(registerHelpers(view));
        },

        renderRecord: function (record, currentPage) {
            return templates.record(registerHelpers({currentPage: currentPage, record: record}));
        }

    };

}(window, jQuery, moment, Mustache));