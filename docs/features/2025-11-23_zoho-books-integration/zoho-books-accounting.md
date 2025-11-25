Splynx Documentation

Search...

[Browse by Tags](https://wiki.splynx.com/t)

[Login](https://wiki.splynx.com/login)

* * *

[Knowledge base](https://wiki.splynx.com/en/home) [Getting Started with Splynx](https://wiki.splynx.com/getting_started_guide) [FAQ](https://wiki.splynx.com/faq) [Changelog 5.2](https://wiki.splynx.com/changelog)

* * *

[Dashboard](https://wiki.splynx.com/dashboard)

CRM

[Customers](https://wiki.splynx.com/customer_management) [Customer Portal](https://wiki.splynx.com/customer_portal) [Leads](https://wiki.splynx.com/crm) [Tickets](https://wiki.splynx.com/tickets) [Finance](https://wiki.splynx.com/finance) [Messages](https://wiki.splynx.com/support_messages)

COMPANY

[Networking](https://wiki.splynx.com/networking) [Network management](https://wiki.splynx.com/network-management) [Scheduling](https://wiki.splynx.com/scheduling) [Inventory](https://wiki.splynx.com/inventory) [Voice](https://wiki.splynx.com/voice) [Tariff Plans](https://wiki.splynx.com/configuring_tariff_plans)

SYSTEM

[Administration](https://wiki.splynx.com/administration) [Configuration](https://wiki.splynx.com/configuration) [My Profile](https://wiki.splynx.com/my_profile) [Add-ons & Modules](https://wiki.splynx.com/addons_modules) [Payment systems](https://wiki.splynx.com/payment_systems)

* * *

[Online backups](https://wiki.splynx.com/online_backups) [Splynx mobile apps](https://wiki.splynx.com/apps) [Splynx High Availability setup](https://wiki.splynx.com/splynx_high_availability) [Miscellaneous](https://wiki.splynx.com/miscellaneous)

- /
[Add-ons & Modules](https://wiki.splynx.com/addons_modules)- /
[Zoho Books accounting](https://wiki.splynx.com/addons_modules/zohobooks)

* * *

Zoho Books accounting

Integrate Zoho Books with Splynx to sync customers, invoices, payments, and more. One-time fee includes expert and concise Zoom support from our specialists.

* * *

Page Contents

Zoho Books accounting

Overview

Installation

Configuration

Starting with Zoho Books

Data mapping

Accounting configuration

Synchronization process

Other settings

Zoho logs

Last edited by

Hanna Kharkova

07/08/2025

# [¶](https://wiki.splynx.com/addons_modules/zohobooks\#zoho-books-accounting) Zoho Books accounting

Contents

- [Overview](https://wiki.splynx.com/addons_modules/zohobooks#overview)
- [Installation](https://wiki.splynx.com/addons_modules/zohobooks#installation)
- [Configuration](https://wiki.splynx.com/addons_modules/zohobooks#configuration)
  - [Zoho Books account](https://wiki.splynx.com/addons_modules/zohobooks#zoho-books-account)
  - [Splynx settings](https://wiki.splynx.com/addons_modules/zohobooks#splynx-settings)
- [Starting with Zoho Books](https://wiki.splynx.com/addons_modules/zohobooks#starting-with-zoho-books)
- [Data mapping](https://wiki.splynx.com/addons_modules/zohobooks#data-mapping)
  - [Payment modes](https://wiki.splynx.com/addons_modules/zohobooks#payment-modes)
- [Accounting configuration](https://wiki.splynx.com/addons_modules/zohobooks#accounting-configuration)
  - [Accounting categories](https://wiki.splynx.com/addons_modules/zohobooks#accounting-categories)
  - [Accounting bank accounts](https://wiki.splynx.com/addons_modules/zohobooks#accounting-bank-accounts)
  - [Accounting tax rates](https://wiki.splynx.com/addons_modules/zohobooks#accounting-tax-rates)
- [Synchronization process](https://wiki.splynx.com/addons_modules/zohobooks#synchronization-process)
  - [Customers](https://wiki.splynx.com/addons_modules/zohobooks#customers)
  - [Invoices and Credit notes](https://wiki.splynx.com/addons_modules/zohobooks#invoices-and-credit-notes)
  - [Payments](https://wiki.splynx.com/addons_modules/zohobooks#payments)
- [Other settings](https://wiki.splynx.com/addons_modules/zohobooks#other-settings)
- [Zoho logs](https://wiki.splynx.com/addons_modules/zohobooks#zoho-logs)

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#overview) Overview

Splynx can sync customers, invoices/credit notes and payments with [Zoho Books](https://www.zoho.com/books/) accounting software.

> For the **Zoho Books integration**, there is a **one-time payment of $1000**. This integration package includes 2 hours of dedicated assistance from our engineers via the Zoom platform. Please be aware that the Zoho Books integration is unique offering priced separately from our standard accounting add-on packages.

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#installation) Installation

To install the **Zoho Books add-on**, navigate to `Config → Integrations → Add-ons`:

![menu.png](https://wiki.splynx.com/content/addons/zohobooks/menu.png)

Locate or search for `splynx-zohobooks` in the list of add-ons. Next, click the _**Install**_ button in the _Actions_ column to begin the installation process:

![install.png](https://wiki.splynx.com/content/addons/zohobooks/install.png)

To install the add-on via CLI, use the following commands:

```bash

```

Copy

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#configuration) Configuration

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#zoho-books-account) Zoho Books account

![image](https://wiki.splynx.com/note.png) You can begin with the Splynx settings and then move on to signing up in Zoho Books. However, please note that the **Organization ID** can only be obtained from the Zoho Books account on their website.

To begin the integration, the first step is to obtain a Zoho Books Online account. For this, visit the official [Zoho Books website](https://www.zoho.com/books/):

![zoho1.png](https://wiki.splynx.com/content/addons/zohobooks/zoho1.png)

Here's how your profile will look after registration:

![zoho2.png](https://wiki.splynx.com/content/addons/zohobooks/zoho2.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#splynx-settings) Splynx settings

To configure the Zoho Books add-on within Splynx, navigate to `Config → Integrations → Modules list` and click the edit button in the _Actions_ column:

![modules.png](https://wiki.splynx.com/content/addons/zohobooks/modules.png)

![modules2.png](https://wiki.splynx.com/content/addons/zohobooks/modules2.png)

Ensure that the entry points are enabled and click on `Save`. Do not change the _API key_ and _API secret_ that are set by default:

![settings1.png](https://wiki.splynx.com/content/addons/zohobooks/settings1.png)

* * *

![settings2.png](https://wiki.splynx.com/content/addons/zohobooks/settings2.png)

**Accounting API settings**:

- **Splynx domain** \- specify your Splynx domain, which is required for the Zoho Books authentication process;
- **Region code** \- specify the region code according to the location of your company;

![image](https://wiki.splynx.com/warning.png) The region code should correspond to the domain of your account, being `US` for accounts with the _**.com**_ domain.

- **Organization ID** \- you can obtain it from your account next to a specific organization on [Zoho Books](https://www.zoho.com/books/):

![organization_id.png](https://wiki.splynx.com/content/addons/zohobooks/organization_id.png)

![image](https://wiki.splynx.com/note.png) Organization ID can vary between different accounts. Each Zoho Books account can have multiple organizations.

- **Use own application** \- enable this toggle if you need your own application created with Zoho. However, it's not obligatory, as by default, the Zoho add-on already works via the Splynx application. It's only necessary if you encounter some incompatibility from your side.

  - _**Client ID**_ \- specify your Client ID;
  - _**Client secret**_ \- specify your Client secret.

![image](https://wiki.splynx.com/note.png)_The mentioned credentials can be obtained after creating your own application on Zoho._

How to create your own application using Zoho

1. Go to the Zoho Developer Console website and sign in with your Zoho account credentials:

[https://api-console.zoho.eu](https://api-console.zoho.eu/) (for EU)

[https://api-console.zoho.com](https://api-console.zoho.com/) (for US)

2. Click on `Get Started`:

![get_started.png](https://wiki.splynx.com/content/addons/zohobooks/get_started.png)

3. Choose _Server-based Applications_ and click on `Create now`:

![server_based.png](https://wiki.splynx.com/content/addons/zohobooks/server_based.png)

4. Use the following callback for the URLs:

```none

```

Copy

![new_client.png](https://wiki.splynx.com/content/addons/zohobooks/new_client.png)

5. Retrieve your **Client ID** and **Client secret**, then specify them within the Zoho Books settings in Splynx:

![credentials_app.png](https://wiki.splynx.com/content/addons/zohobooks/credentials_app.png)

![credentials_app2.png](https://wiki.splynx.com/content/addons/zohobooks/credentials_app2.png)

> **If you encounter any difficulties** while creating your application, please don't hesitate to contact our **support team**. Our specialists are ready to assist you: [support@splynx.com](mailto:support@splynx.com)

* * *

![settings3.png](https://wiki.splynx.com/content/addons/zohobooks/settings3.png)

**General settings:**

- **Payment statement grouping** \- choose how payments will be grouped together (monthly or daily);
- **Partners ignore list** \- choose partners to be excluded from the synchronization process;
- **Export from date** \- specify the date by which invoices, credit notes, or payments will not be exported;
- **Currency** \- if you want to keep the default currency, leave this field empty. If you need a different currency for exporting new customers, invoices, and credit notes, execute 'Mapping settings' and copy a currency ID from the link provided in the Currency field description.

* * *

![settings4.png](https://wiki.splynx.com/content/addons/zohobooks/settings4.png)

**Customers and invoices export:**

- **Customer name pattern** \- you can export customers to Zoho with modified names according to the specified pattern. Variables may include: {id}, {login}, {name}, {email}.

- **Check data before export** \- additional API call to Zoho will be executed before customer updating. You need to enable this option if your customers records have additional contact persons and you want to prevent them from being deleted.

- **Ignore inactive customers** \- toggle this option to exclude inactive customers and their financial documents during sync. However, if a customer was synced before deactivation or manually paired, their financial documents will still be included.

- **Rounding item category ID** \- specify the rounding item for invoices and credit notes. The accounting ID can be obtained from `Config → Finance → Accounting categories`.


* * *

![settings5.png](https://wiki.splynx.com/content/addons/zohobooks/settings5.png)

**Payments export and import:**

- **Export enabled** \- enables/disables the export of payment data to Zoho;
- **Export: allowed payment methods** \- define the payment methods permitted for export;
- **Zoho payment modes** \- enter here Zoho Books payment modes (one payment mode per line);

> ![image](https://wiki.splynx.com/details.png)
>
> Please refer to ["Payment modes"](https://wiki.splynx.com/addons_modules/zohobooks#payment_modes) for further details.

- **Default payment mode** \- enter the default payment mode for Zoho Books here. This mode will be used for payment export when there isn't a matched Zoho payment mode for the Splynx payment method.

* * *

- **Import enabled** \- toggles whether the import of payment data from Zoho is active;
- **Accounting payment method** \- allows you to select the label under which the imported payments will be recorded in Splynx;
- **Import payments from date** \- specify the date from which to start importing payments, which is useful for not importing historical payments that are not relevant or already accounted for;
- **Create payment always** \- if enabled, Splynx will always create the imported payment, even if the specific billing document it relates to is already paid. This might be relevant for keeping track of all financial movements for auditing purposes.

* * *

These are the global settings for automatically syncing items between the two platforms in any selected syncing direction:

![settings6.png](https://wiki.splynx.com/content/addons/zohobooks/settings6.png)

**Cron settings (automatic synchronization):**

![image](https://wiki.splynx.com/note.png) All cron toggles are disabled by default.

- **Cron launch time** \- set the time when cron jobs will be launched for automatic synchronization;
- **Customers** \- enables/disables automatic syncing of customers;
- **Invoices** \- enables/disables automatic syncing of invoices;
- **Credit notes** \- enables/disables automatic syncing of credit notes;
- **Payments** \- enables/disables automatic syncing of payments.

![image](https://wiki.splynx.com/note.png) It is recommended that all settings in the Cron settings section be **disabled** during the initial setup of the add-on to prevent automatic syncing of these elements via cron jobs. The first import and export should be performed manually in `Finance → Zoho Accounting`.

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#starting-with-zoho-books) Starting with Zoho Books

1. After completing the configuration and setting up your Zoho account, congratulations! You are now ready to begin working with Zoho Books. To do so, navigate to **Finance → Zoho Accounting** and click on `Connect with Zoho Books` in the gear menu.

![finance_menu.png](https://wiki.splynx.com/content/addons/zohobooks/finance_menu.png)

![connect.png](https://wiki.splynx.com/content/addons/zohobooks/connect.png)

2. You will be redirected to the Zoho Books website, where you will need to grant Splynx permission to access data in your Zoho account:

![allow.png](https://wiki.splynx.com/content/addons/zohobooks/allow.png)

3. After acceptance, the OAuth token will be generated and saved in the configuration. You will be informed about the success of its creation:

![token.png](https://wiki.splynx.com/content/addons/zohobooks/token.png)

After this, you need to perform data mapping.

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#data-mapping) Data mapping

Mapping is a critical step to ensure that data is accurately transferred between Splynx and Zoho Books.

Now, we need to import and map certain Zoho entities to Splynx entities:

a) **Accounting categories**

_**Zoho:**_`Items`

_**Splynx config:**_`Config → Finance → Accounting categories`

Additionally, categories can be mapped in the standalone form (`Finance → Zoho Accounting → Service menu (gear icon) → Accounting categories mapping`). This form does not display the current mapping but suggests appropriate pairs for each entity when Splynx's and Zoho's entities share the same name.

b) **Accounting bank accounts**

_**Zoho:**_`Accountant → Chart of Accounts`

_**Splynx config**_: `Config → Finance → Accounting bank accounts`

c) **Accounting taxes**

_**Zoho:**_`Settings → Taxes`

_**Splynx config:**_`Config → Finance → Accounting tax rates`

![image](https://wiki.splynx.com/note.png) Also you can use button `Load` on the Splynx config forms.

d) **Payment modes**

In Zoho, each payment includes a field titled **"Payment mode",** which features a list of values resembling Splynx payment methods.

> ![image](https://wiki.splynx.com/details.png)
>
> Please refer to ["Payment modes"](https://wiki.splynx.com/addons_modules/zohobooks#payment_modes) for further details.

To start data mapping, click on `Mapping settings`:

![mapping.png](https://wiki.splynx.com/content/addons/zohobooks/mapping.png)

Here we can see that mapping was successful:

![mapping2.png](https://wiki.splynx.com/content/addons/zohobooks/mapping2.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#payment-modes) Payment modes

Each payment in Zoho has a field called _Payment mode_ with a list of values that resemble Splynx payment methods.

You can enter the list of **Zoho payment modes** in the addon config (section `Payments export`):

![payment_export.png](https://wiki.splynx.com/content/addons/zohobooks/payment_export.png)

![image](https://wiki.splynx.com/note.png) The default list of Zoho payment modes is incomplete. All the latest items will be updated with mapping. Additionally, please note that this list is **not synchronized regularly**. If you make changes in Zoho Books, you must **manually sync and map** them afterward on the Splynx side.

It is possible to map Zoho's and Splynx's payment entities on the standalone form by clicking on `Payment modes mapping` under _Finance → Zoho Accounting_ in the gear menu:

![mode_map.png](https://wiki.splynx.com/content/addons/zohobooks/mode_map.png)

The form will display the current mapping and suggest proper values through name matching if there are no mapped values. When done, click on `Save` under the form.

![mode_form.png](https://wiki.splynx.com/content/addons/zohobooks/mode_form.png)

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#accounting-configuration) Accounting configuration

After successful synchronization, make changes to _Accounting categories_, _Accounting bank accounts_ and _Taxes settings_ in `Config → Finance`:

![accounting_items.png](https://wiki.splynx.com/content/addons/zohobooks/accounting_items.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#accounting-categories) Accounting categories

All accounting categories from Zoho Books (`Zoho: Sales`) must be assigned to transactions categories in Splynx (`Config →  Finance → Transaction categories`). This can be done in two ways:

1. Automatically, by clicking on the `Accounting categories mapping` item in the settings menu under Finance → Zoho Accounting; it will generate a preview of the transaction categories that will be paired with accounting categories by category name. You can manually select another category to pair from the dropdown list. Afterward, click the `Save` button to initiate the pairing process.

![categories_mapping.png](https://wiki.splynx.com/content/addons/zohobooks/categories_mapping.png)

![categories_mapping2.png](https://wiki.splynx.com/content/addons/zohobooks/categories_mapping2.png)

2. Manually, under `Config →  Finance → Accounting categories`:

![categories_mapping3.png](https://wiki.splynx.com/content/addons/zohobooks/categories_mapping3.png)

![categories_mapping4.png](https://wiki.splynx.com/content/addons/zohobooks/categories_mapping4.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#accounting-bank-accounts) Accounting bank accounts

As soon as the relevant categories are configured, we can proceed with bank accounts. Navigate to `Config → Finance → Accounting bank accounts`.

Assign the Zoho Books bank accounts (`Zoho: Accountant →  Chart of Accounts`) to payment methods (`Config → Finance → Payment methods`) in Splynx. Also, the default bank account should be selected. Click on `Save`.

![bank_accounts.png](https://wiki.splynx.com/content/addons/zohobooks/bank_accounts.png)

![bank_accounts2.png](https://wiki.splynx.com/content/addons/zohobooks/bank_accounts2.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#accounting-tax-rates) Accounting tax rates

You can set tax rates in Zoho Books under `Settings → Taxes`:

![tax_rates.png](https://wiki.splynx.com/content/addons/zohobooks/tax_rates.png)

After that, to assign tax rates from Splynx to those from Zoho Books, navigate to `Config → Finance → Accounting tax rates` in the Splynx interface. Then click on `Save`.

![tax_rates2.png](https://wiki.splynx.com/content/addons/zohobooks/tax_rates2.png)

![tax_rates3.png](https://wiki.splynx.com/content/addons/zohobooks/tax_rates3.png)

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#synchronization-process) Synchronization process

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#customers) Customers

When the accounting settings are complete, you can export customers from Splynx to Zoho Books or match existing clients in the databases:

![customers_export.png](https://wiki.splynx.com/content/addons/zohobooks/customers_export.png)

Then check if all clients were pushed to Zoho Books:

![customer_export2.png](https://wiki.splynx.com/content/addons/zohobooks/customer_export2.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#invoices-and-credit-notes) Invoices and Credit notes

Once the customers' export is completed, you can export invoices/credit notes:

![invoices_export.png](https://wiki.splynx.com/content/addons/zohobooks/invoices_export.png)

Then check if all invoices/credit notes were pushed to Zoho Books:

![invoices_export2.png](https://wiki.splynx.com/content/addons/zohobooks/invoices_export2.png)

![credit_notes.png](https://wiki.splynx.com/content/addons/zohobooks/credit_notes.png)

**Example of invoice export**

Here, our customer has an unpaid invoice for £50:

![example2.png](https://wiki.splynx.com/content/addons/zohobooks/example2.png)

Let's export it to Zoho. Alternatively, it can be done automatically by cron if the option is enabled in the add-on configuration.

![example2_1.png](https://wiki.splynx.com/content/addons/zohobooks/example2_1.png)

The invoice export was successful, as evidenced by the information displayed on the screen:

![example2_2.png](https://wiki.splynx.com/content/addons/zohobooks/example2_2.png)

The invoice has appeared in the list of invoices on our Zoho Books account:

![example2_3.png](https://wiki.splynx.com/content/addons/zohobooks/example2_3.png)

### [¶](https://wiki.splynx.com/addons_modules/zohobooks\#payments) Payments

First of all, you need to export payments from Splynx:

![payments_export.png](https://wiki.splynx.com/content/addons/zohobooks/payments_export.png)

![payments_export2.png](https://wiki.splynx.com/content/addons/zohobooks/payments_export2.png)

Payments can also be imported from Zoho. You have the option to import either new payments exclusively or all payments.

![image](https://wiki.splynx.com/note.png) Sometimes, when you need to create a payment for a later date on Zoho, attempting to import such a payment by clicking on `New payments` may result in **import failure**. In such cases, **we recommend** clicking the `All payments` button instead.

![image](https://wiki.splynx.com/warning.png) Payment imports are **restricted**. You can only import payments that cover existing invoices in Splynx and are not yet paid. If a payment covers an invoice that exists only in Zoho or covers several invoices, then such payment will either be ignored or created as a non-linked payment (when _"Create payment always"_ is turned on in the addon configuration).

![payments_import.png](https://wiki.splynx.com/content/addons/zohobooks/payments_import.png)

**Example of payment export**

Our customer has paid a one-time invoice of £50:

![payment1.png](https://wiki.splynx.com/content/addons/zohobooks/payment1.png)

If you perform manual synchronization, navigate to _Finance → Zoho Accounting_, and then click on `Payments`:

![payment2.png](https://wiki.splynx.com/content/addons/zohobooks/payment2.png)

The payment is now added to Zoho and linked to the invoice that was previously synchronized with Zoho:

![payment3.png](https://wiki.splynx.com/content/addons/zohobooks/payment3.png)

Now, the invoice status has been updated to `Paid` on Zoho as well:

![payment4.png](https://wiki.splynx.com/content/addons/zohobooks/payment4.png)

**Example of payment import**

We have processed a new payment of £100 for our customer on our Zoho Books account:

![example3.png](https://wiki.splynx.com/content/addons/zohobooks/example3.png)

Now, we need to import it into Splynx. To do this, we click on `New payments`:

![example3_2.png](https://wiki.splynx.com/content/addons/zohobooks/example3_2.png)

After the import is completed, let's navigate to the customer's account and verify if the payment is present. As you can see, the new payment has been successfully imported from Zoho:

![example3_1.png](https://wiki.splynx.com/content/addons/zohobooks/example3_1.png)

Payments synced from Zoho can be viewed in `Finance → Payment statements → History`:

![payment_history.png](https://wiki.splynx.com/content/addons/zohobooks/payment_history.png)

![payment_history2.png](https://wiki.splynx.com/content/addons/zohobooks/payment_history2.png)

## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#other-settings) Other settings

![gear_menu.png](https://wiki.splynx.com/content/addons/zohobooks/gear_menu.png)

In this menu, you will find additional settings and tools related to the Zoho Books add-on.

- **Connect with Zoho Books** \- if the Zoho Books add-on has been disconnected from the Zoho Books account, you will need to reconnect it here;

- **Refresh OAuth Token** \- setting to refresh the OAuth token;

- **Manual Synchronization** \- it opens `Finance → Zoho Accounting` when you are in another menu window;

- **Tools** \- this menu is used for resetting the accounting database. All items previously selected in `Accounting categories`, `Accounting bank accounts`, and `Accounting tax rates` will be erased. It is primarily used when the organization undergoes changes. Before changing the organization, the accounting database must be reset:


![reset.png](https://wiki.splynx.com/content/addons/zohobooks/reset.png)

- **Customers manual pairing** \- this function is used when there are existing customers in both Splynx and Zoho, and they need to be paired so that both systems recognize them as the same customer.

**Example of customers manual pairing**

First, click the `Load customers for manual pairing` button. This feature retrieves the customer list from Zoho into Splynx, enabling the admin to manually pair customers without the need to recreate them in either platform.

![pairing1.png](https://wiki.splynx.com/content/addons/zohobooks/pairing1.png)

Then navigate to `Customers manual pairing` and enter the name of the customer you wish to pair with the Splynx customer:

![pairing1_2.png](https://wiki.splynx.com/content/addons/zohobooks/pairing1_2.png)

![pairing2.png](https://wiki.splynx.com/content/addons/zohobooks/pairing2.png)

If successful, the status will change to `Paired`:

![pairing3.png](https://wiki.splynx.com/content/addons/zohobooks/pairing3.png)

- **Accounting categories mapping** \- the link is used to automatically map accounting categories instead of performing the mapping manually;

- **Payment modes mapping** \- the link is used to manually pair payment modes;

- **Module Config** \- the link is used to open the Zoho Books add-on configuration page (`Config → Integrations → Modules list → Zoho Accounting`).

- **Synchronization logs** \- the link is used to open the Zoho logs under `Administration → Logs → Accounting integrations`.


## [¶](https://wiki.splynx.com/addons_modules/zohobooks\#zoho-logs) Zoho logs

Sync logs can be found under `Administration → Logs → Accounting integrations`:

![logs1.png](https://wiki.splynx.com/content/addons/zohobooks/logs1.png)

If a customer/invoice/credit note/payment has an `Accounting ID`, this indicates that it was synced; if not, it was not synced.

![logs2.png](https://wiki.splynx.com/content/addons/zohobooks/logs2.png)

![logs3.png](https://wiki.splynx.com/content/addons/zohobooks/logs3.png)

[![](https://splynx.com/wp-content/uploads/2022/02/Logo.svg)](https://splynx.com/)

ISP Billing and Network Management System

###### Product

- [Home](https://splynx.com/)
- [Pricing](https://splynx.com/pricing/)
- [Live demo](https://demo.splynx.com/)

###### Resources

- [Knowledge base](https://wiki.splynx.com/)
- [Video tutorials](https://deploy.splynx.com/)
- [Blog](https://splynx.com/blog/)
- [Forum](https://forum.splynx.com/)
- [Product updates](https://splynx.com/product-updates/)

###### Company

- [Who we are](https://splynx.com/who-we-are/)
- [Contact us](https://splynx.com/contacts/)
- [News](https://splynx.com/news/)

###### Connect with us

- [![Facebook](https://splynx.com/wp-content/themes/Splynx/img/facebook.svg)](https://www.facebook.com/IspFramework)
- [![Twitter](https://splynx.com/wp-content/themes/Splynx/img/twitter.svg)](https://twitter.com/IspFramework)
- [![Instagram](https://splynx.com/wp-content/themes/Splynx/img/instagram.svg)](https://www.instagram.com/splynxframework)
- [![Youtube](https://splynx.com/wp-content/themes/Splynx/img/youtube.svg)](https://www.youtube.com/channel/UCQB0vydoC1LOqdheTPkxWpA)
- [![Linkedin](https://splynx.com/wp-content/themes/Splynx/img/linkedin.svg)](https://www.linkedin.com/company/splynx-isp-framework/)

© Splynx ISP Framework by Splynx s.r.o

[Cookies Policy](https://splynx.com/cookie-policy/) [Privacy Policy](https://splynx.com/privacy-policy/)