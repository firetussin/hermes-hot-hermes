"""Run after building preview bundle; browser fixture never contacts Hermes."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'preview/index.html').as_uri())
    page.get_by_text('3 of 11 profiles reported served',exact=True).wait_for()
    assert page.evaluate('fixture.acquired')==0
    assert page.evaluate('fixture.probes')==0
    page.get_by_role('button',name='Keep 5',exact=True).click()
    assert page.get_by_role('region',name='Keep-ready planner').is_visible()
    primary=page.get_by_role('button',name='Review keep-ready request',exact=True)
    assert primary.bounding_box()['y']+primary.bounding_box()['height']<900
    page.get_by_text('Advanced · RAM assumptions & reserve',exact=True).click()
    page.get_by_label('RAM low (MiB/profile)',exact=True).fill('100')
    page.get_by_label('RAM high (MiB/profile)',exact=True).fill('300')
    page.get_by_role('button',name='Review keep-ready request',exact=True).click()
    assert page.get_by_text('Keep 5 selected profiles ready on demo-host?',exact=True).is_visible()
    assert page.evaluate('fixture.acquired')==0
    page.get_by_role('button',name='Start keep-ready',exact=True).click()
    page.get_by_text('5 retention handles · tools and caches unverified',exact=True).wait_for()
    assert page.evaluate('fixture.acquired')==5
    assert page.evaluate('fixture.probes')==5
    page.get_by_text('Last request · observed change',exact=True).wait_for()
    page.get_by_role('button',name='Use observed average for planning',exact=True).click()
    assert page.get_by_label('RAM low (MiB/profile)',exact=True).input_value()=='100.0'
    page.screenshot(path=str(root/'preview/desktop.png'),full_page=True)
    page.get_by_role('button',name='Release Hot Hermes retention',exact=True).click()
    page.get_by_text('0 retention handles · tools and caches unverified',exact=True).wait_for()
    assert page.evaluate('fixture.released')==5
    page.get_by_role('button',name='Keep 8',exact=True).click()
    page.get_by_role('button',name='Review keep-ready request',exact=True).click()
    page.get_by_role('button',name='Start keep-ready',exact=True).click()
    page.get_by_text('8 retention handles · tools and caches unverified',exact=True).wait_for()
    page.evaluate('fixture.fail=true; fixture.tick()')
    page.get_by_text('0 retention handles · tools and caches unverified',exact=True).wait_for()
    assert page.get_by_text('Failed',exact=True).count()==8
    page.set_viewport_size({"width":760,"height":900})
    page.screenshot(path=str(root/'preview/narrow.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.get_by_text('Measurement, settings & compatibility',exact=True).click()
    assert '[object Object]' not in page.locator('body').inner_text()
    page.get_by_role('button',name='Open Hermes Settings',exact=True).click()
    assert page.evaluate('fixture.navigated')=='/settings'
    page.set_viewport_size({"width":1280,"height":800})
    page.goto((root/'preview/index.html').as_uri()+'?shared=1')
    page.get_by_text('All 11 profiles are already served by one gateway',exact=True).wait_for()
    page.get_by_role('button',name='Keep 5',exact=True).click()
    primary=page.get_by_role('button',name='Review keep-ready request',exact=True)
    box=primary.bounding_box();assert box['y']+box['height']<800
    assert 'additional profiles reported served' not in page.locator('body').inner_text()
    assert page.evaluate('fixture.acquired')==0
    page.screenshot(path=str(root/'preview/shared-gateway.png'),full_page=True)
    page.evaluate("document.documentElement.style.setProperty('--ui-bg-primary','#f5f2ed');document.documentElement.style.setProperty('--ui-bg-secondary','#fff');document.documentElement.style.setProperty('--ui-text-primary','#211b17');document.documentElement.style.setProperty('--ui-text-secondary','#625b54');document.documentElement.style.setProperty('--ui-stroke-secondary','#ded7cf')")
    page.screenshot(path=str(root/'preview/light.png'),full_page=True)
    assert not errors,errors
    browser.close()
    print(json.dumps({"passed":True,"checks":["passive monitoring never wakes","five-profile preview","explicit apply only","retention verification","measured warm-up comparison","release cleanup","eight profiles","disconnect demotes readiness","narrow layout","settings navigation","shared-gateway count of 11","primary visible at 1280x800","light-theme visual capture","no runtime errors"]}))
