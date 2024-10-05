# WPUtils
This is a firefox web extension for simultaneous UAT and Production environments wordpress development on different domains. 

It's main features are:
* allow copying elements from WPBakery to and from separate domains
* a paster that lets you configure multiple different forms with JSON for quick pasting (Open with CTRL+SHIFT+F1 or on extensions toolbar as a popup)
* and allows you to configure 2 different domains so by right clicking on the tab and pressing Open in opposite you can quickly open the equivalent page at the different domain

I add stuff as I need it, if a task is very repetitive I'll probably implement it here.

## Loading the addon
This is very much a work in progress so it is not packaged yet. To load it you'll have to go to the about:debugging#/runtime/this-firefox (on firefox) and load it as a temporary add on.

Preconfigure the WP domains in the addons Options page and optionally add "Quick Paster Form Descriptors" which are the form input elements described in JSON for the quick paster.

## Options page

Go to about:addons, then click on the extension and the options tab. There you'll be able to configure the domains for switching environments as well as the Quick Paster Form Descriptors for pasting.

## Quick Paster

The quick paster allows you to quickly paste data into input elements by specifying a CSS selector for the input and the value you want to paste. It was designed to solve filing out the same data multiple times on diffrent pages. 

You can open the Quick Paster sidebar with CTRL+SHIFT+F1 or in the extensions toolbar as a popup.

If you don't see any forms in the quick paster you must add them in the options page.

An example of the descriptors are as follows:
```
{
	"Forms": [
	    {
	        "name": "Programs",
	        "fields": [
	            {
	                "field_name": "Program Name",
	                "CSS_Selector": "#programInput",
	                "type": "text"
	            },
	            {
	                "field_name": "Program Type",
	                "CSS_Selector": "input#programType",
	                "type": "text"
	            },
	            {
	                "field_name": "Program End",
	                "CSS_Selector": ".programDateEnd input",
	                "type": "date",
	                "value": "2024-01-31"
	            }
	        ]
	    }
	]
}
```

You don't need to include the value field, this would simply leave the field empty so you can configure it in the sidebar/popup.

Adding the value field just initializes the quick paster with that value. Since the quick paster has persistence any change to the default value will be overrun until new descriptors are submitted in the options page.

The type field corresponds to HTML input types, right now only text and date are supported (this is simply for form generation, if you're targeted element contains a value attribute it will still work).

The Descriptor above would produce this in the sidebar:

![Quick Paster Example](./quickpasterexample.png "Quick Paster Example")
