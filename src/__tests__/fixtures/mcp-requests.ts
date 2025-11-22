export const mockSearchDocsRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'search_babylon_docs',
    arguments: {
      query: 'PBR materials',
      category: 'api',
      limit: 10,
    },
  },
  id: 1,
};

export const mockGetDocRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'get_babylon_doc',
    arguments: {
      path: '/divingDeeper/materials/using/introToPBR',
    },
  },
  id: 2,
};

export const mockInvalidRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'unknown_tool',
    arguments: {},
  },
  id: 3,
};
