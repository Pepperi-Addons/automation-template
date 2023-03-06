"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addQueryAndOptions(url, options = {}) {
    const optionsArr = [];
    Object.keys(options).forEach((key) => {
        optionsArr.push(key + '=' + encodeURIComponent(options[key]));
    });
    const query = optionsArr.join('&');
    return query ? url + '?' + query : url;
}
class ElasticSearchService {
    constructor(service) {
        this.service = service;
        this.papiClient = service.papiClient;
        this.generalService = service;
    }
    async uploadTempFile(body) {
        const tempFileURLs = await this.papiClient.post('/file_storage/tmp');
        const tempFileResult = await this.generalService
            .fetchStatus(tempFileURLs.UploadURL, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                Authorization: null,
            },
        })
            .then((response) => {
            if (response.Ok) {
                return tempFileURLs.DownloadURL;
            }
            else {
                return 'temp file upload failed ' + response.Status;
            }
        });
        return tempFileResult;
    }
    postBulkData(type, body) {
        return this.papiClient.post('/elasticsearch/bulk/' + type, body);
    }
    postDeleteData(type, body) {
        const deleteData = { query: { bool: { must: { match: body } } } };
        return this.papiClient.post('/elasticsearch/delete/' + type, deleteData);
    }
    getTotals(type, options = {}) {
        //problem here
        let url = `/addons/shared_index/index/papi_data_index/totals/10979a11-d7f4-41df-8993-f06bfd778304/${type}`;
        url = addQueryAndOptions(url, options);
        return this.papiClient.get(url);
    }
    getElasticSearch(type, options = {}) {
        let url = `/elasticsearch/${type}`;
        url = addQueryAndOptions(url, options);
        return this.papiClient.get(url);
    }
    whereClause(fields, clause) {
        return this.papiClient.post('/elasticsearch/all_activities?fields=' + fields + '&where=' + clause);
    }
    postUpdateData(terms, field, update) {
        const updateData = {
            query: { bool: { must: { terms: terms } } },
            script: { source: `ctx._source[${field}]${update}` },
        };
        return this.papiClient.post('/elasticsearch/update/all_activities', updateData);
    }
    postSearchData(search, size, sort) {
        let searchData;
        switch (sort) {
            case undefined:
                searchData = {
                    size: size,
                    from: 0,
                    track_total_hits: true,
                    query: {
                        bool: {
                            must: [
                                {
                                    match: search,
                                },
                            ],
                        },
                    },
                };
                return this.papiClient.post('/elasticsearch/search/all_activities', searchData);
            default:
                searchData = {
                    size: size,
                    from: 0,
                    track_total_hits: true,
                    query: {
                        bool: {
                            must: [
                                {
                                    match: search,
                                },
                            ],
                        },
                    },
                    sort: [sort],
                };
                return this.papiClient.post('/elasticsearch/search/all_activities', searchData);
        }
    }
    clearIndex(type) {
        return this.papiClient.get('/elasticsearch/clear/' + type);
    }
}
exports.ElasticSearchService = ElasticSearchService;
//# sourceMappingURL=elastic-search.service.js.map