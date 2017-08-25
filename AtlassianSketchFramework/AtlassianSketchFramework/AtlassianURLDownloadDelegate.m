//
//  AtlassianNSURLDownloadDelegate.m
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/25/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import "AtlassianRequestDelegates.h"

@implementation AtlassianURLDownloadDelegate : AtlassianBaseRequestDelegate

- (void)download:(NSURLDownload __unused *)download
    didReceiveResponse:(NSURLResponse *)response
{
    self.response = (NSHTTPURLResponse*) response;
    self.progress.totalUnitCount = response.expectedContentLength;
}

- (void)download:(NSURLDownload __unused *)download
    didCreateDestination:(NSString *)path
{
    self.filePath = path;
}

- (void)download:(NSURLDownload __unused *)download
    didReceiveDataOfLength:(NSUInteger)length
{
    self.progress.completedUnitCount += length;
}

- (void)downloadDidFinish:(NSURLDownload __unused *)download
{
    self.completed = YES;
}

- (void)download:(NSURLDownload __unused *)download
    didFailWithError:(NSError *)error
{
    self.error = error;
    self.failed = YES;
}

@end
