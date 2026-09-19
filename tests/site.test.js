const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const session = require('express-session');

const users = []; const comments = []; const attachments = new Map();
let failReads = false;
const places = require('../data/places.json');
const db = {
  async query(sql, args = []) {
    if (sql.startsWith('SELECT * FROM users WHERE email')) return [users.filter(u => u.email === args[0])];
    if (sql.startsWith('INSERT INTO users')) { users.push({ id: users.length + 1, first_name: args[0], last_name: args[1], email: args[2], password_hash: args[3], isAdmin: 0 }); return [{}]; }
    if (sql.includes('FROM places')) return [sql.includes('WHERE') ? places.filter(p => p.name === args[0]) : places];
    if (sql.startsWith('INSERT INTO attachments')) { attachments.set(args[0], args[2]); return [{}]; }
    if (sql.startsWith('SELECT content FROM attachments')) return [attachments.has(args[0]) ? [{content:attachments.get(args[0])}] : []];
    if (sql.startsWith('INSERT INTO comments')) { comments.push({id:args[0],name:args[1],description:args[2],author_id:args[3],parent_id:args[4],file_path:args[5],author:'Test User'}); return [{}]; }
    if (sql.includes('FROM comments c')) {
      if (failReads) throw Object.assign(new Error('unavailable'), {code:'ECONNREFUSED'});
      return [sql.includes('WHERE c.id =') ? comments.filter(c => c.id === args[0]) : comments];
    }
    if (sql.startsWith('UPDATE comments SET view_count')) return [{}];
    throw new Error('Unexpected test query: ' + sql);
  },
  async getConnection() { return {query:this.query.bind(this), async beginTransaction(){},async commit(){},async rollback(){},release(){}}; }
};
require.cache[require.resolve('../data/database')] = { exports: db };
require.cache[require.resolve('express-mysql-session')] = { exports: () => session.MemoryStore };
const { app } = require('../app');
const server = app.listen(0, '127.0.0.1');
const ready = new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => server.close(resolve)));
async function request(url, options={}) {
  await ready;
  return fetch(`http://127.0.0.1:${server.address().port}${url}`, {redirect:'manual', ...options});
}
test('public pages and Linux template names work', async () => {
  for (const route of ['/', '/mesta', '/login', '/sign-up', '/comments', '/place/'+encodeURIComponent(places[0].name)]) {
    const res = await request(route); assert.equal(res.status,200,route); await res.text();
  }
  assert.equal((await request('/not-found')).status,404);
  for (const p of places) assert.ok(fs.existsSync(path.join(__dirname,'../public',p.image_path)));
});
test('all templates render with representative records and unknown attachment extension', async () => {
  const user = {id:1,first_name:'Test',last_name:'User',email:'test@example.test'};
  const comment = {id:'a',name:'Place',description:'Text',author:'Test',author_id:1,parent_id:null,file_path:'/attachments/test.unknown'};
  for (const file of fs.readdirSync(path.join(__dirname,'../views')).filter(f => f.endsWith('.ejs'))) {
    await ejs.renderFile(path.join(__dirname,'../views',file), {userId:1,isAdmin:true,isAuthenticated:true,user,users:[user],place:places[0],places,comment,com:comment,comments:[comment],replies:[],parent_id:null,numberOfComments:1,mime:require('mime-types')});
  }
});
test('registration, login, authenticated upload and anonymous access restrictions', async () => {
  assert.equal((await request('/admin/users')).status,403);
  const noAuth = await request('/addComment',{method:'POST'}); assert.equal(noAuth.status,302); assert.equal(noAuth.headers.get('location'),'/login');
  const form = {firstName:'Test',lastName:'User',email:'test@example.test',password:'valid-password'};
  let res=await request('/signup',{method:'POST',body:new URLSearchParams(form)}); assert.equal(res.status,302);
  assert.notEqual(users[0].password_hash,form.password);
  res=await request('/login',{method:'POST',body:new URLSearchParams(form)}); assert.equal(res.status,302);
  const cookie=res.headers.get('set-cookie').split(';')[0];
  const body=new FormData(); body.set('name',places[0].name);body.set('description','Test upload');
  const bytes=Buffer.from([137,80,78,71,13,10,26,10,0]);body.set('file',new Blob([bytes]),'test.png');
  res=await request('/addComment',{method:'POST',headers:{cookie},body});assert.equal(res.status,302);
  assert.equal(comments[0].parent_id,null);
  res=await request(comments[0].file_path);assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/png');
  assert.deepEqual(Buffer.from(await res.arrayBuffer()),bytes);
  res=await request('/comments/'+comments[0].id);assert.equal(res.status,200);
  const oversized=new FormData();oversized.set('file',new Blob([Buffer.alloc(5*1024*1024+1)]),'big.bin');
  res=await request('/addComment',{method:'POST',headers:{cookie},body:oversized});assert.equal(res.status,413);
  res=await request('/signup',{method:'POST',headers:{origin:'https://unrelated.example'},body:new URLSearchParams(form)});assert.equal(res.status,403);
});
test('database read failure produces 500 without stopping server',async () => {
  failReads=true;
  try { assert.equal((await request('/comments')).status,500); } finally { failReads=false; }
  assert.equal((await request('/')).status,200);
});
