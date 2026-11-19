#!/usr/bin/env python3
"""Extract Sea Power aircraft payloads for 1985 from StreamingAssets/original.zip.
No game files are altered. Comments and unknown fields are retained conservatively.
"""
import re, json, zipfile, collections, pathlib, argparse

MAIN = {
  'a6e': ('usn_a-6e','A-6E Intruder'), 'fa18a': ('usn_fa-18a','F/A-18A Hornet'),
  'f14a': ('usn_f-14a','F-14A Tomcat'), 'ea6b': ('usn_ea-6b','EA-6B Prowler'),
  'e2c': ('usn_e-2c','E-2C Hawkeye'), 's3a': ('usn_s-3a','S-3A Viking'),
  'sh2f': ('usn_sh-2f','SH-2F Seasprite'), 'sh3h': ('usn_sh-3h','SH-3H Sea King'),
  'hh3e': ('usaf_hh-3','HH-3E'), 'ah1t': ('usmc_ah-1t','AH-1T Cobra'),
}

def parse_sections(txt):
    secs={};current=None
    for raw in txt.splitlines():
        t=raw.strip()
        if t.startswith('[') and ']' in t:
            current=t[1:t.index(']')]; secs.setdefault(current,{})
        elif current and '=' in t and not t.startswith(('#',';','//')):
            k,v=t.split('=',1)
            secs[current][k.strip()]=v.split('//',1)[0].strip()
    return secs

def date_choice(rule,year):
    parts=[]
    for v in rule.split('|'):
        if ',' not in v: continue
        raw,weapon=v.split(',',1)
        try: d=int(raw.strip())
        except ValueError: continue
        if d <=year: parts.append((d,weapon.strip()))
    return max(parts,key=lambda x:x[0])[1] if parts else None

def name_src_key(filename):
    return filename.rsplit('/',1)[-1][:-4]

def extract(z:zipfile.ZipFile,year=1985):
    files=set(z.namelist())
    names=parse_sections(z.read('language_es/loadout_names.ini').decode('utf-8-sig',errors='replace')).get('LoadoutNames',{})
    ammo={}
    for fn in sorted(files):
        if fn.startswith('ammunition/') and fn.endswith('.ini'):
            secs=parse_sections(z.read(fn).decode('utf-8-sig',errors='replace'))
            g=secs.get('General',{}); a=secs.get('Ammunition',{})
            ammo[name_src_key(fn)]={
                'file':fn,'type':g.get('Type'), 'ioc':g.get('IOCDate'), 'foc':g.get('FOCDate'),
                'target':g.get('TargetType'),'ammoPoints':g.get('AmmoPoints'),
                'supplyCategory':g.get('SupplyCategory'),
                'containerItem':a.get('Ammunition'), 'attachments':a.get('NumberOfAttachments'),
                'sonar':secs.get('OnBoardSystems',{}).get('Sonar'),
                'lifetimeSeconds':g.get('LifeTime'),
                'transmitterRange':secs.get('OnBoardSystems',{}).get('TransmitterRange'),
                'maxLaunchRange':secs.get('Guidance',{}).get('MaxLaunchRange'),
            }
    units=[]; unknown=[]; all_weapons=set();
    for atlas_id,(stem,name) in MAIN.items():
        fn=f'aircraft/{stem}.ini'
        assert fn in files, fn
        secs=parse_sections(z.read(fn).decode('utf-8-sig',errors='replace'))
        w=secs.get('WeaponSystems',{});
        n=int(w.get('NumberOfWeaponSystems',0))
        codes=[x.strip() for x in w.get('AvailableLoadouts','').split(',') if x.strip()]
        out=[]
        for code in codes:
            start=w.get('LoadoutDate_'+code)
            if start and start.isnumeric() and int(start)>year: continue
            stations=[];prep=[]; cooldown=[]
            for i in range(1,n+1):
                k='WeaponSystem'+str(i)+code
                sec=secs.get(k)
                if not sec: continue
                if 'ReadyUpTime' in sec:
                    try: prep.append(float(sec['ReadyUpTime']))
                    except ValueError: pass
                if 'CoolDownTime' in sec:
                    try: cooldown.append(float(sec['CoolDownTime']))
                    except ValueError: pass
                config=secs.get('WeaponSystem'+str(i),{})
                for field,value in sec.items():
                    if not re.fullmatch('Station\\d+',field): continue
                    identifier=value.split('|',1)[0].strip()
                    if identifier.startswith('DateBased_'):
                        resolved=date_choice(w.get(identifier,''),year)
                        if not resolved: unknown.append({'aircraft':name,'preset':code,'source':identifier})
                    else: resolved=identifier
                    rack=value.split('|',1)[1].strip() if '|' in value else None
                    positions=(config.get(rack+'Positions','') if rack else '')
                    count=len(positions.split('|')) if positions else 1
                    qtysource='rack' if positions else 'station'
                    # AMMO container is an optional additional layer of nested payload.
                    details=ammo.get(resolved, {})
                    payload={
                        'station':field, 'system':i, 'source':identifier,'ammo':resolved,
                        'rack':rack,'loadedUnits':count, 'countBasis':qtysource,
                    }
                    if details:
                        payload['type']=details.get('type')
                        if details.get('type')=='Container' and details.get('attachments'):
                            try: payload['childCountPerContainer']=int(details['attachments'])
                            except ValueError: pass
                            payload['childAmmo']=details.get('containerItem')
                    stations.append(payload)
                    if resolved:all_weapons.add(resolved)
            totals=collections.Counter(); breakdown=[]
            for v in stations:
                if not v['ammo']: continue
                totals[v['ammo']]+=v['loadedUnits']
            for weapon,count in totals.items():
                o=ammo.get(weapon,{})
                breakdown.append({'ammo':weapon,'qty':count,'type':o.get('type'), 'ioc':o.get('ioc'), 'foc':o.get('foc'), 'supplyCategory':o.get('supplyCategory')})
            out.append({'code':code,'name':names.get(code,code),'readyUpMinutes':max(prep) if prep else None, 'coolDownMinutes':max(cooldown) if cooldown else None,
                'stations':stations,'payload':breakdown,'dateLimit':start if start and start.isnumeric() else None})
        senses=[]
        for k,v in secs.items():
            if k.startswith('SensorSystem') and re.fullmatch('SensorSystem\\d+',k):
                senses.append({'type':v.get('Type'),'name':v.get('SystemName')})
        unit={'id':atlas_id,'name':name,'source':fn,'year':year,'loadouts':out,'sensors':senses,
              'performance':{k:secs.get('Performance',{}).get(k) for k in ('MaxSpeedAtSeaLevel','CruiseAltitude','MaxFuel','Ceiling') if k in secs.get('Performance',{})}}
        units.append(unit)
    game={'schemaVersion':1,'kind':'sea-power-loadouts','year':year,'origin':'StreamingAssets/original','source':'original.zip',
          'note':'Extraído de originales. No incluye sobrescrituras/modificaciones en Workshop y la aplicación de condiciones internas del juego puede alterar las cargas mostradas.',
          'aircraft':units,
          'ammunition':{k:ammo[k] for k in sorted(all_weapons) if k in ammo},
          'warnings':unknown}
    return game

def compact_for_atlas(data):
    """Produce the small, client-side format consumed by Sea Power Atlas."""
    small={"version":1,"year":data["year"],"source":data["origin"],
           "warning":"Cantidad calculada segun estaciones/racks de los INI; puede diferir por mods o reglas del juego. No incluye Workshop.",
           "aircraft":[],"ammo":{}}
    for unit in data['aircraft']:
        row={'id':unit['id'],'name':unit['name'],'source':unit['source'],
             'sensors':unit['sensors'],'loadouts':[]}
        for l in unit['loadouts']:
            row['loadouts'].append({
               'code':l['code'],'name':l['name'],'ready':l['readyUpMinutes'],
               'cooldown':l['coolDownMinutes'],
               'items':[{'id':i['ammo'],'qty':i['qty'],'basis':'rack/station','type':i['type']}
                        for i in l['payload']]})
        small['aircraft'].append(row)
    for id,v in data['ammunition'].items():
        keys=['type','ioc','foc','target','supplyCategory','containerItem','attachments','lifetimeSeconds','transmitterRange','sonar']
        small['ammo'][id]={key:v[key] for key in keys if v.get(key) is not None}
    return small

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('zipfile',type=pathlib.Path);p.add_argument('--year',type=int,default=1985);p.add_argument('--output',type=pathlib.Path,default=pathlib.Path('source_1985.json'));p.add_argument('--full',action='store_true',help='Export station-level audit rather than Atlas compact JSON');args=p.parse_args()
    with zipfile.ZipFile(args.zipfile) as z:
        data=extract(z,args.year)
    exported=data if args.full else compact_for_atlas(data)
    args.output.write_text(json.dumps(exported,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print('Saved',args.output,'bytes',args.output.stat().st_size,'aircraft',len(data['aircraft']),'loadouts',sum(len(x['loadouts']) for x in data['aircraft']),'ammo',len(data['ammunition']),'unresolved',len(data['warnings']))
    for unit in data['aircraft']:
        print(unit['name'],len(unit['loadouts']),', '.join(x['code'] for x in unit['loadouts']))
