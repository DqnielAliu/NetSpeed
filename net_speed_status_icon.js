/*
 * Copyright 2011-2019 Amir Hedayaty < hedayaty AT gmail DOT com >
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const _ = Gettext.domain('netspeed').gettext;
const NetSpeedLayoutMenuItem = Extension.imports.net_speed_layout_menu_item;

const Lib = Extension.imports.lib;
const Logger = Lib.getLogger();

/**
 * Class NetSpeedStatusIcon
 * status icon, texts for speeds, the drop-down menu
 */
var NetSpeedStatusIcon = GObject.registerClass(class NetSpeedStatusIcon extends PanelMenu.Button {
    /**
     * NetSpeedStatusIcon: _init
     * Constructor
     */
    _init(net_speed) {
        this._net_speed = net_speed;
        super._init(0.0);

        // extension button
        this._box = new St.BoxLayout();
        this.add_actor(this._box);
        this.connect('button-release-event', Lang.bind(this, this._toggle_showsum));

        // download
        this._download_box = new St.BoxLayout();
        this._down = new St.Label({ text: "---", style_class: 'ns-horizontal-label', y_align: Clutter.ActorAlign.CENTER});
        this._downunit = new St.Label({ text: "", style_class: 'ns-horizontal-unit-label', y_align: Clutter.ActorAlign.CENTER});
        this._downicon = new St.Label({ text: "↓", style_class: 'ns-horizontal-icon', y_align: Clutter.ActorAlign.CENTER});
        this._download_box.add_actor(this._down);
        this._download_box.add_actor(this._downunit);
        this._download_box.add_actor(this._downicon);

        // upload
        this._upload_box = new St.BoxLayout();
        this._up = new St.Label({ text: "---", style_class: 'ns-horizontal-label', y_align: Clutter.ActorAlign.CENTER});
        this._upunit = new St.Label({ text: "", style_class: 'ns-horizontal-unit-label', y_align: Clutter.ActorAlign.CENTER});
        this._upicon = new St.Label({ text: "↑", style_class: 'ns-horizontal-icon', y_align: Clutter.ActorAlign.CENTER});
        this._upload_box.add_actor(this._up);
        this._upload_box.add_actor(this._upunit);
        this._upload_box.add_actor(this._upicon);

        // sum
        this._sum_box = new St.BoxLayout();
        this._sum = new St.Label({ text: "---", style_class: 'ns-horizontal-label', y_align: Clutter.ActorAlign.CENTER});
        this._sumunit = new St.Label({ text: "", style_class: 'ns-horizontal-unit-label', y_align: Clutter.ActorAlign.CENTER});
        this._sum_box.add_actor(this._sum);
        this._sum_box.add_actor(this._sumunit);

        // metrics box
        this._metrics_box = new St.BoxLayout({y_align: Clutter.ActorAlign.CENTER});
        this._metrics_box.add_actor(this._download_box);
        this._metrics_box.add_actor(this._upload_box);
        this._metrics_box.add_actor(this._sum_box);
        this._box.add_actor(this._metrics_box);

        // interface icon
        this._icon_box = new St.BoxLayout();
        this._icon = this._get_icon(this._net_speed.get_device_type(this._net_speed.getDevice()));
        this._icon_box.add_actor(this._icon);
        this._box.add_actor(this._icon_box);

        // Add pref luncher
        this._pref = new St.Button({ child: this._get_icon("pref") });
        this._pref.connect("clicked", function () {
            ExtensionUtils.openPrefs();
        });

        this._menu_title = new NetSpeedLayoutMenuItem.NetSpeedLayoutMenuItem(_("Device"), this._pref, this._net_speed.menu_label_size);
        this._menu_title.connect("activate", Lang.bind(this, this._change_device, ""));
        this._menu_title.update_speeds({ up: _("Up"), down: _("Down") });
        this._menu_title.update_ips([_("IP")]);
        this._menu_title.show_ip(this._net_speed.show_ips);
        this.menu.addMenuItem(this._menu_title);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._layouts = new Array();
        this.updateui();
    }

    /**
     * NetSpeedStatusIcon :_change_device
     */
    _change_device(param1, param2, device) {
        this._net_speed.setDevice(device);
        this.updateui();
        this._net_speed.save();
    }

    /**
     * NetSpeedStatusIcon: _toggle_showsum
     */
    _toggle_showsum(actor, event) {
        let button = event.get_button();
        if (button == 2) { // middle
            this._net_speed.showsum = !this._net_speed.showsum;
            this.updateui();
            this._net_speed.save();
        }
    }

    /**
     * NetSpeedStatusIcon: updateui
     * update ui according to settings
     */
    updateui() {
        // Set the size of labels
        this._sum.set_width(this._net_speed.label_size);
        this._sumunit.set_width(this._net_speed.unit_label_size);
        this._up.set_width(this._net_speed.label_size);
        this._upunit.set_width(this._net_speed.unit_label_size);
        this._down.set_width(this._net_speed.label_size);
        this._downunit.set_width(this._net_speed.unit_label_size);

        // Show up + down or sum
        if (this._net_speed.showsum == false) {
            this._sum.hide();
            this._sumunit.hide();
            this._upicon.show();
            this._up.show();
            this._upunit.show();
            this._downicon.show();
            this._down.show();
            this._downunit.show();
            this.set_vertical_alignment(this._net_speed.vert_align);
        } else {
            this._sum.show();
            this._sumunit.show();
            this._upicon.hide();
            this._up.hide();
            this._upunit.hide();
            this._downicon.hide();
            this._down.hide();
            this._downunit.hide();
            // ignore vertical alignment with sum
            this.set_vertical_alignment(false);
        }

        // Change the type of Icon
        this._icon.destroy();
        const device = this._net_speed.getDevice();

        Logger.debug("Device -> " + device);

        this._icon = this._get_icon(this._net_speed.get_device_type(device));
        this._icon_box.add_actor(this._icon);
        // Show icon or not
        if (this._net_speed.use_icon)
            this._icon.show();
        else
            this._icon.hide();
        // Update Menu sizes
        this._menu_title.update_ui(this._net_speed.menu_label_size);
        this._menu_title.show_ip(this._net_speed.show_ips);
        for (let layout of this._layouts) {
            layout.update_ui(this._net_speed.menu_label_size);
            layout.show_ip(this._net_speed.show_ips);
        }
    }

    /**
     * NetSpeedStatusIcon: _get_icon
     * Utility function to create icon from name
     */
    _get_icon(name, size) {
        if (arguments.length == 1)
            size = 16;
        let iconname = "";
        switch (name) {
            case "none":
                iconname = "network-transmit-receive-symbolic";
                break;
            case "ethernet":
                iconname = "network-wired-symbolic";
                break;
            case "wifi":
                iconname = "network-wireless-signal-excellent-symbolic";
                break;
            case "bt":
                iconname = "bluetooth-active-symbolic";
                break;
            case "olpcmesh":
                iconname = "network-wired-symbolic";
                break;
            case "wimax":
                iconname = "network-wirelss-signal-excellent-symbolic"; // Same for wifi
                break;
            case "modem":
                iconname = "gnome-modem"; // Hope works!
                break;
            case "up":
                iconname = "go-up-symbolic";
                break;
            case "down":
                iconname = "go-down-symbolic";
                break;
            case "pref":
                iconname = "emblem-system-symbolic";
                break;
            default:
                iconname = "network-transmit-receive-symbolic";
        }

        return new St.Icon({
            icon_name: iconname,
            icon_size: size,
        });
    }

    /**
     * NetSpeedStatusIcon: set_labels
     */
    set_labels(sum, up, down) {
        this._sum.set_text(sum.text);
        this._sumunit.set_text(sum.unit);

        this._up.set_text(up.text);
        this._upunit.set_text(up.unit);

        this._down.set_text(down.text);
        this._downunit.set_text(down.unit);
    }

    /**
     * NetSpeedStatusIcon: create_menu
     */
    create_menu(devices, types) {
        for (let layout of this._layouts) {
            layout.destroy();
        }
        this._layouts = new Array();
        for (let i = 0; i < devices.length; ++i) {
            let icon = this._get_icon(types[i]);
            let layout = new NetSpeedLayoutMenuItem.NetSpeedLayoutMenuItem(devices[i], icon, this._net_speed.menu_label_size);
            layout.show_ip(this._net_speed.show_ips);
            layout.connect("activate", Lang.bind(this, this._change_device, devices[i]));
            this._layouts.push(layout);
            this.menu.addMenuItem(layout);
        }
    }

    /**
     * NetSpeedStatusIcon: update_speeds
     */
    update_speeds(speeds) {
        for (let i = 0; i < speeds.length; ++i) {
            this._layouts[i].update_speeds(speeds[i]);
        }
    }

    /**
     * NetSpeedStatusIcon: set_vertical_alignment
     */
    set_vertical_alignment(tof) {
        this._metrics_box.set_vertical(tof);
        let align = tof ? 'vertical' : 'horizontal';
        this._down.set_style_class_name('ns-' + align + '-label');
        this._downunit.set_style_class_name('ns-' + align + '-unit-label');
        this._downicon.set_style_class_name('ns-' + align + '-icon');
        this._up.set_style_class_name('ns-' + align + '-label');
        this._upunit.set_style_class_name('ns-' + align + '-unit-label');
        this._upicon.set_style_class_name('ns-' + align + '-icon');
    }

    /**
     * NetSpeedStatusIcon: update_ips
     */
    update_ips(ips) {
        for (let i = 0; i < ips.length; ++i) {
            this._layouts[i].update_ips(ips[i]);
        }
    }

});
