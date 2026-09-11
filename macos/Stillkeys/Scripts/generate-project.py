#!/usr/bin/env python3
"""Generate the checked-in Xcode project without third-party dependencies."""
import hashlib, json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
objects = {}
def uid(label): return hashlib.sha1(label.encode()).hexdigest()[:24].upper()
def add(label, isa, **values):
    key = uid(label)
    objects[key] = {'isa': isa, **values}
    return key
def ref(path, kind): return add('file:'+path, 'PBXFileReference', lastKnownFileType=kind, path=path, sourceTree='<group>')
def quote(value, level=0):
    indent = '\t' * level
    if isinstance(value, dict):
        if not value: return '{}'
        return '{\n' + '\n'.join(indent + '\t' + json.dumps(k) + ' = ' + quote(v, level+1) + ';' for k, v in value.items()) + '\n' + indent + '}'
    if isinstance(value, list):
        if not value: return '()'
        return '(\n' + '\n'.join(indent + '\t' + quote(v, level+1) + ',' for v in value) + '\n' + indent + ')'
    if isinstance(value, int): return str(value)
    return json.dumps(str(value), ensure_ascii=False)
app_sources = sorted(str(p.relative_to(root)) for p in (root/'Stillkeys').rglob('*.swift'))
unit_sources = sorted(str(p.relative_to(root)) for p in (root/'StillkeysTests').glob('*.swift'))
ui_sources = sorted(str(p.relative_to(root)) for p in (root/'StillkeysUITests').glob('*.swift'))
source_refs = {p: ref(p, 'sourcecode.swift') for p in app_sources+unit_sources+ui_sources}
resource_paths = ['Stillkeys/Resources/Assets.xcassets', 'Stillkeys/Resources/PrivacyInfo.xcprivacy']
resource_refs = [ref(p, 'folder.assetcatalog' if p.endswith('xcassets') else 'text.xml') for p in resource_paths]
config_refs = [ref('Config/'+p, 'text.plist.entitlements') for p in ['Stillkeys.entitlements','StillkeysDirect.entitlements']]
configs = ['Debug','Release','DirectDebug','DirectRelease']
base = {'SDKROOT':'macosx','MACOSX_DEPLOYMENT_TARGET':'14.0','SWIFT_VERSION':'6.0','CLANG_ENABLE_MODULES':'YES','CLANG_ENABLE_OBJC_ARC':'YES','SWIFT_STRICT_CONCURRENCY':'complete','GCC_WARN_UNUSED_VARIABLE':'YES','GCC_WARN_UNUSED_FUNCTION':'YES','CLANG_WARN_DOCUMENTATION_COMMENTS':'YES','ENABLE_STRICT_OBJC_MSGSEND':'YES','GCC_NO_COMMON_BLOCKS':'YES','CLANG_WARN_BOOL_CONVERSION':'YES','CLANG_WARN_CONSTANT_CONVERSION':'YES','CLANG_WARN_ENUM_CONVERSION':'YES'}
project_configs=[]
for name in configs:
    debug = name.endswith('Debug') or name == 'Debug'
    settings = {**base, 'SWIFT_OPTIMIZATION_LEVEL':'-Onone' if debug else '-O','DEBUG_INFORMATION_FORMAT':'dwarf' if debug else 'dwarf-with-dsym','ONLY_ACTIVE_ARCH':'YES' if debug else 'NO','ENABLE_TESTABILITY':'YES' if debug else 'NO','SWIFT_COMPILATION_MODE':'singlefile' if debug else 'wholemodule'}
    if debug: settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS']='DEBUG $(inherited)'
    project_configs.append(add('project-config:'+name,'XCBuildConfiguration',buildSettings=settings,name=name))
project_list = add('project-config-list','XCConfigurationList',buildConfigurations=project_configs,defaultConfigurationIsVisible=0,defaultConfigurationName='Release')
products=[]
targets=[]
app_target=uid('target:Stillkeys')
for name, files, product_type in [('Stillkeys',app_sources,'com.apple.product-type.application'),('StillkeysTests',unit_sources,'com.apple.product-type.bundle.unit-test'),('StillkeysUITests',ui_sources,'com.apple.product-type.bundle.ui-testing')]:
    is_app = name == 'Stillkeys'
    extension = 'app' if is_app else 'xctest'
    product=add('product:'+name,'PBXFileReference',explicitFileType='wrapper.application' if is_app else 'wrapper.cfbundle',includeInIndex=0,path=name+'.'+extension,sourceTree='BUILT_PRODUCTS_DIR')
    products.append(product)
    source_builds=[add('build:'+p,'PBXBuildFile',fileRef=source_refs[p]) for p in files]
    phases=[add('sources:'+name,'PBXSourcesBuildPhase',buildActionMask=2147483647,files=source_builds,runOnlyForDeploymentPostprocessing=0)]
    phases.append(add('frameworks:'+name,'PBXFrameworksBuildPhase',buildActionMask=2147483647,files=[],runOnlyForDeploymentPostprocessing=0))
    resource_builds=[add('resource:'+p,'PBXBuildFile',fileRef=r) for p,r in zip(resource_paths,resource_refs)] if is_app else []
    phases.append(add('resources:'+name,'PBXResourcesBuildPhase',buildActionMask=2147483647,files=resource_builds,runOnlyForDeploymentPostprocessing=0))
    target_configs=[]
    for config in configs:
        direct=config.startswith('Direct')
        debug=config.endswith('Debug') or config=='Debug'
        settings={'PRODUCT_NAME':'$(TARGET_NAME)','GENERATE_INFOPLIST_FILE':'YES','CODE_SIGN_STYLE':'Automatic','DEVELOPMENT_TEAM':'','SWIFT_EMIT_LOC_STRINGS':'YES','LD_RUNPATH_SEARCH_PATHS':['$(inherited)','@executable_path/../Frameworks'],'PRODUCT_BUNDLE_IDENTIFIER':'com.coffeeandfun.'+name.lower()+('.direct' if direct else '')}
        if is_app:
            settings['CODE_SIGN_INJECT_BASE_ENTITLEMENTS']='YES' if debug else 'NO'
            settings.update({'PRODUCT_MODULE_NAME':'Stillkeys','MARKETING_VERSION':'1.0.0','CURRENT_PROJECT_VERSION':'1','ENABLE_HARDENED_RUNTIME':'YES','ENABLE_APP_SANDBOX':'NO' if direct else 'YES','CODE_SIGN_ENTITLEMENTS':'Config/StillkeysDirect.entitlements' if direct else 'Config/Stillkeys.entitlements','ASSETCATALOG_COMPILER_APPICON_NAME':'AppIcon','ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME':'AccentColor','INFOPLIST_KEY_LSApplicationCategoryType':'public.app-category.utilities','INFOPLIST_KEY_NSHumanReadableCopyright':'Copyright © 2026 Coffee and Fun LLC.','INFOPLIST_KEY_CFBundleDisplayName':'Stillkeys','INFOPLIST_KEY_LSMinimumSystemVersion':'$(MACOSX_DEPLOYMENT_TARGET)','INFOPLIST_KEY_NSPrincipalClass':'NSApplication'})
            if direct: settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS']=('DEBUG ' if debug else '')+'STILLKEYS_DIRECT $(inherited)'
        else:
            settings['GENERATE_INFOPLIST_FILE']='YES'
            if name == 'StillkeysTests':
                settings['TEST_HOST']='$(BUILT_PRODUCTS_DIR)/Stillkeys.app/Contents/MacOS/Stillkeys'
                settings['BUNDLE_LOADER']='$(TEST_HOST)'
            else: settings['TEST_TARGET_NAME']='Stillkeys'
        target_configs.append(add('config:'+name+config,'XCBuildConfiguration',buildSettings=settings,name=config))
    config_list=add('config-list:'+name,'XCConfigurationList',buildConfigurations=target_configs,defaultConfigurationIsVisible=0,defaultConfigurationName='Release')
    dependencies=[]
    if not is_app:
        proxy=add('proxy:'+name,'PBXContainerItemProxy',containerPortal=uid('project'),proxyType=1,remoteGlobalIDString=app_target,remoteInfo='Stillkeys')
        dependencies=[add('dependency:'+name,'PBXTargetDependency',target=app_target,targetProxy=proxy)]
    targets.append(add('target:'+name,'PBXNativeTarget',buildConfigurationList=config_list,buildPhases=phases,buildRules=[],dependencies=dependencies,name=name,productName=name,productReference=product,productType=product_type))
product_group=add('products-group','PBXGroup',children=products,name='Products',sourceTree='<group>')
app_groups=[add('source-group:'+folder,'PBXGroup',children=[source_refs[p] for p in app_sources if p.startswith('Stillkeys/'+folder+'/')],name=folder,sourceTree='<group>') for folder in ['App','Core','Services','Views']]
app_groups.append(add('resource-group','PBXGroup',children=resource_refs,name='Resources',sourceTree='<group>'))
production_group=add('production-group','PBXGroup',children=app_groups,name='Stillkeys',sourceTree='<group>')
unit_group=add('unit-group','PBXGroup',children=[source_refs[p] for p in unit_sources],name='StillkeysTests',sourceTree='<group>')
ui_group=add('ui-group','PBXGroup',children=[source_refs[p] for p in ui_sources],name='StillkeysUITests',sourceTree='<group>')
config_group=add('config-group','PBXGroup',children=config_refs,name='Config',sourceTree='<group>')
doc_refs=[ref(str(p.relative_to(root)),'net.daringfireball.markdown') for p in sorted((root/'Docs').glob('*.md'))]
docs_group=add('docs-group','PBXGroup',children=doc_refs,name='Docs',sourceTree='<group>')
store_refs=[ref(str(p.relative_to(root)),'net.daringfireball.markdown') for p in sorted((root/'Store').glob('*.md'))]
store_refs.extend([ref('Store/metadata.json','text.json'),ref('Store/Screenshots','folder')])
store_group=add('store-group','PBXGroup',children=store_refs,name='Store',sourceTree='<group>')
main_group=add('main-group','PBXGroup',children=[production_group,unit_group,ui_group,config_group,docs_group,store_group,ref('README.md','net.daringfireball.markdown'),product_group],sourceTree='<group>')
project=add('project','PBXProject',attributes={'BuildIndependentTargetsInParallel':'YES','LastSwiftUpdateCheck':'2660','LastUpgradeCheck':'2660','TargetAttributes':{t:{'CreatedOnToolsVersion':'26.6'} for t in targets}},buildConfigurationList=project_list,compatibilityVersion='Xcode 14.0',developmentRegion='en',hasScannedForEncodings=0,knownRegions=['en','Base'],mainGroup=main_group,productRefGroup=product_group,projectDirPath='',projectRoot='',targets=targets)
folder=root/'Stillkeys.xcodeproj'
folder.mkdir(exist_ok=True)
(folder/'project.pbxproj').write_text('// !$*UTF8*$!\n'+quote({'archiveVersion':1,'classes':{},'objectVersion':56,'objects':objects,'rootObject':project})+'\n')
schemes=folder/'xcshareddata/xcschemes'
schemes.mkdir(parents=True,exist_ok=True)
def buildref(target, product): return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{uid("target:"+target)}" BuildableName="{product}" BlueprintName="{target}" ReferencedContainer="container:Stillkeys.xcodeproj"/>'
for direct in [False,True]:
    name='Stillkeys Direct' if direct else 'Stillkeys'
    debug='DirectDebug' if direct else 'Debug'
    release='DirectRelease' if direct else 'Release'
    appref=buildref('Stillkeys','Stillkeys.app')
    testrefs=''.join(f'<TestableReference skipped="NO">{buildref(t,t+".xctest")}</TestableReference>' for t in ['StillkeysTests','StillkeysUITests']) if not direct else ''
    content=f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2660" version="1.7">
<BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{appref}</BuildActionEntry></BuildActionEntries></BuildAction>
<TestAction buildConfiguration="{debug}" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables>{testrefs}</Testables></TestAction>
<LaunchAction buildConfiguration="{debug}" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{appref}</BuildableProductRunnable></LaunchAction>
<ProfileAction buildConfiguration="{release}" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{appref}</BuildableProductRunnable></ProfileAction>
<AnalyzeAction buildConfiguration="{debug}"/><ArchiveAction buildConfiguration="{release}" revealArchiveInOrganizer="YES"/>
</Scheme>'''
    (schemes/(name+'.xcscheme')).write_text(content)
print(folder)
