export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/serviceRequest' && request.method === 'POST') {
            interface RequestBody {
                machineId: string;
            }

            const body: RequestBody = await request.json();
            const machineID = body.machineId;

            if (!machineID || !/^[0-9]{3}-[A-Z]{3}$/.test(machineID)) {
                console.log('Invalid machine ID format:', machineID);
                return new Response('Invalid machine ID format. Expected format: 123-ABC.', { status: 400 });
            }

            try {
                console.log('Fetching SiteID for Machine ID:', machineID);

                const siteIdResponse = await fetch(`https://www.cscsw.com/wp-json/cscsw/v1/SearchByMachineID/${machineID}`, {
                    headers: {
                        "accept": "/",
                        "accept-language": "en-US,en;q=0.8",
                        "priority": "u=1, i",
                        "sec-ch-ua": '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "sec-gpc": "1",
                        "x-requested-with": "XMLHttpRequest",
                        "Referer": "https://www.cscsw.com/request-service/",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    method: "GET"
                });

                if (!siteIdResponse.ok) {
                    console.error('Failed to fetch SiteID for Machine ID:', machineID);
                    return new Response('Failed to fetch SiteID', { status: 500 });
                }

                interface MachineInfo {
                    SiteID: string;
                    MachineIDAlreadyReported: boolean;
                }

                const siteData: MachineInfo = await siteIdResponse.json();
                const siteID = siteData?.SiteID;

                if (!siteID) {
                    console.warn('SiteID not found for Machine ID:', machineID);
                    return new Response('SiteID not found.', { status: 404 });
                }

                if (siteData?.MachineIDAlreadyReported) {
                    console.warn('Machine ID already reported:', machineID);
                    return new Response('Machine ID already reported.', { status: 400 });
                }

                console.log('Submitting service request for Site ID:', siteID);

                const serviceRequestResponse = await fetch("https://www.cscsw.com/wp-json/cscsw/v1/SubmitQuickServiceRequest/", {
                    headers: {
                        "accept": "/",
                        "accept-language": "en-US,en;q=0.8",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "priority": "u=1, i",
                        "sec-ch-ua": '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "sec-gpc": "1",
                        "x-requested-with": "XMLHttpRequest",
                        "Referer": "https://www.cscsw.com/request-service/",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    method: "POST",
                    body: `MachineID=${machineID}&MachineType=Washer&SiteID=${siteID}&TripCharge=0&SiteName=GEORGIA+INSTITUTE+OF+TECHNOLOGY&FirstName=GT&LastName=Housing&Email=housinghelpdesk%40housing.gatech.edu&Phone=404-894-2470&Notes=&ProblemCode=Out+Of+Order&PONumber=`
                });

                if (!serviceRequestResponse.ok) {
                    console.error('Failed to submit service request for Site ID:', siteID);
                    return new Response('Failed to submit service request', { status: 500 });
                }

                console.log('Service request submitted successfully for Machine ID:', machineID);
                return new Response('Service request submitted successfully.', { status: 200 });

            } catch (error) {
                console.error('Error occurred while processing the request:', error);
                return new Response('An error occurred while processing the request.', { status: 500 });
            }
        }

        console.warn('Invalid endpoint or method:', url.pathname, request.method);
        return new Response('Not Found', { status: 404 });
    }
} satisfies ExportedHandler<Env>;
