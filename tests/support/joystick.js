export async function joystickGeometry(page){
  const box=await page.locator('[data-joystick]').boundingBox();
  if(!box)throw new Error('The joystick is not visible');
  return {x:box.x+box.width/2,y:box.y+box.height/2,radius:box.width*.28};
}

/** Real Chromium touch contacts; no application input or simulation state is edited. */
export async function touchController(page){
  const cdp=await page.context().newCDPSession(page),contacts=new Map();
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:3});
  async function begin(point){contacts.set(point.id,point);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...contacts.values()]});}
  async function move(id,x,y){
    if(!contacts.has(id))throw new Error(`Touch ${id} is not active`);
    contacts.set(id,{id,x,y});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[...contacts.values()]});
  }
  async function end(id){
    const point=contacts.get(id);if(!point)return;
    // Chromium releases the listed contact IDs, preserving the other finger.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point]});contacts.delete(id);
  }
  async function cancel(){if(contacts.size)await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});contacts.clear();}
  async function tap(selector,id=2){const r=await page.locator(selector).boundingBox();await begin({id,x:r.x+r.width/2,y:r.y+r.height/2});await end(id);}
  async function stick(x,y,id=1){const g=await joystickGeometry(page);await begin({id,x:g.x,y:g.y});await move(id,g.x+x*g.radius,g.y+y*g.radius);return g;}
  return {begin,move,end,cancel,tap,stick,detach:()=>cdp.detach()};
}
