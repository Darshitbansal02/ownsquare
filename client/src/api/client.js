export function createApi(baseURL, transport = fetch) {
  let accessToken = null;
  let sessionVersion = 0;
  let refreshPromise = null;
  const unauthorized = new Set();

  const isAuthExempt = path => path.startsWith('/auth/');

  async function rawRequest(path, {method='GET',body,query,headers={},token=accessToken} = {}) {
    const url = new URL(baseURL.replace(/\/$/,'') + path);
    for(const [key,value] of Object.entries(query??{})) if(value!==undefined && value!==null && value!=='') url.searchParams.set(key,String(value));
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await transport(url,{
      method,
      credentials: 'include',
      headers:{...headers,...(token && {Authorization:`Bearer ${token}`}),...(!multipart && body!==undefined && {'Content-Type':'application/json'})},
      ...(body!==undefined && {body:multipart ? body : JSON.stringify(body)})
    });
    let payload;
    try {payload=await response.json();} catch {throw Object.assign(new Error('The server returned an invalid response'),{status:response.status,code:'INTERNAL_ERROR',details:[]});}
    if(!response.ok || !payload.success) {
      throw Object.assign(new Error(payload.error?.message??'Request failed'),{status:response.status,code:payload.error?.code??'INTERNAL_ERROR',details:payload.error?.details??[]});
    }
    return payload.data;
  }

  async function refreshTokens() {
    if (!refreshPromise) {
      const currentSession = sessionVersion;
      refreshPromise = (async () => {
        try {
          const data = await rawRequest('/auth/refresh', { method: 'POST', body: {}, token: null });
          if (sessionVersion === currentSession) {
            accessToken = data.accessToken;
          }
          return data;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  }

  async function request(path, {method='GET',body,query,headers={}} = {}, isRetry = false) {
    const token = accessToken;
    try {
      return await rawRequest(path, {method,body,query,headers,token});
    } catch (error) {
      if (token !== accessToken) {
        throw error;
      }
      if (error.code === 'UNAUTHORIZED') {
        if (!isRetry && !isAuthExempt(path)) {
          try {
            const refreshed = await refreshTokens();
            return await rawRequest(path, {method,body,query,headers,token:refreshed.accessToken});
          } catch {
            if (token === accessToken) {
              accessToken = null;
              for (const listener of unauthorized) listener();
            }
            throw error;
          }
        }
        if (token && token === accessToken) {
          accessToken = null;
          for (const listener of unauthorized) listener();
        }
      }
      throw error;
    }
  }

  const post=(path,body={})=>request(path,{method:'POST',body}),patch=(path,body={})=>request(path,{method:'PATCH',body}),get=(path,query)=>request(path,{query});
  return {
    setAccessToken(token) {sessionVersion++; accessToken=token; refreshPromise=null;},
    getAccessToken() {return accessToken;},
    onUnauthorized(callback) {unauthorized.add(callback);return ()=>unauthorized.delete(callback);},
    auth:{
      register:body=>post('/auth/register',body),
      login:body=>post('/auth/login',body),
      refresh:()=>post('/auth/refresh',{}),
      logout:()=>post('/auth/logout'),
      me:()=>get('/auth/me'),
      updateProfile:body=>patch('/auth/me',body),
      changePassword:body=>post('/auth/change-password',body),
      forgotPassword:body=>post('/auth/forgot-password',body),
      resetPassword:(token,body)=>post(`/auth/reset-password/${encodeURIComponent(token)}`,body)
    },
    properties:{list:query=>get('/properties',query),detail:id=>get(`/properties/${id}`),create:body=>post('/properties',body),update:(id,body)=>patch(`/properties/${id}`,body),submit:id=>post(`/properties/${id}/submit`),investors:(id,query)=>get(`/properties/${id}/investors`,query),approve:id=>post(`/properties/${id}/approve`),reject:(id,body)=>post(`/properties/${id}/reject`,body),changeStatus:(id,body)=>post(`/properties/${id}/status`,body),payoutPreview:(id,query)=>get(`/properties/${id}/payout-preview`,query),sell:(id,body)=>post(`/properties/${id}/sell`,body)},
    investments:{create:(body,key)=>request('/investments',{method:'POST',body,headers:{'Idempotency-Key':key}}),me:query=>get('/investments/me',query)},
    portfolio:{summary:()=>get('/portfolio/summary')},
    wallet:{get:()=>get('/wallet'),order:body=>post('/wallet/topup/order',body),verify:body=>post('/wallet/topup/verify',body),withdraw:body=>post('/wallet/withdraw',body),withdrawals:query=>get('/wallet/withdrawals',query)},
    transactions:{list:query=>get('/transactions',query)},
    admin:{stats:query=>get('/admin/stats',query),users:query=>get('/admin/users',query),updateUser:(id,body)=>patch(`/admin/users/${id}`,body),properties:query=>get('/admin/properties',query),settings:()=>get('/admin/settings'),updateSettings:body=>patch('/admin/settings',body),withdrawals:query=>get('/admin/withdrawals',query),reviewWithdrawal:(id,body)=>patch(`/admin/withdrawals/${id}`,body),reviewKyc:(id,body)=>patch(`/admin/kyc/${id}`,body)},
    kyc:{submit:body=>post('/kyc',body)},
    broker:{properties:query=>get('/broker/properties',query)},enquiries:{list:query=>get('/enquiries',query),create:body=>post('/enquiries',body),reply:(id,body)=>post(`/enquiries/${id}/reply`,body)},
    notifications:{list:query=>get('/notifications',query),markRead:id=>patch(`/notifications/${id}/read`)},
    uploads:{create:(file,purpose)=>{const body=new FormData();body.append('file',file);body.append('purpose',purpose);return post('/uploads',body);}},
    platform:{stats:()=>get('/platform/stats')}
  };
}
